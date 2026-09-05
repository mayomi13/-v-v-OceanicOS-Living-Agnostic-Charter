import {
  Authorizer,
  Clock,
  Executor,
  GatewayDependencies,
  GatewayError,
  GatewaySnapshot,
  GatewayState,
  IdGenerator,
  Observer,
  Planner,
  ProvenanceEvent,
  Rollback,
  TaskIntent,
  Tester,
  TestReport,
  VerificationReport,
  Verifier,
  ExecutionResult,
  AuthorizationDecision,
  EvidenceRecord,
  Attestation,
  isTerminalState,
} from "./contracts";

const TRANSITIONS: Readonly<Record<GatewayState, readonly GatewayState[]>> = {
  RECEIVED: ["PARSED", "REJECTED", "FAILED"],
  PARSED: ["OBSERVED", "REJECTED", "FAILED"],
  OBSERVED: ["DISSENTED", "BLOCKED", "FAILED"],
  DISSENTED: ["PLANNED", "BLOCKED", "FAILED"],
  PLANNED: ["AWAITING_AUTHORIZATION", "BLOCKED", "FAILED"],
  AWAITING_AUTHORIZATION: ["AUTHORIZED", "REJECTED", "BLOCKED", "FAILED"],
  AUTHORIZED: ["EXECUTING", "REJECTED", "FAILED"],
  EXECUTING: ["TESTING", "FAILED", "ROLLBACK_PENDING"],
  TESTING: ["ATTESTED", "ROLLBACK_PENDING", "FAILED"],
  ATTESTED: ["COMPLETED", "ROLLBACK_PENDING", "FAILED"],
  COMPLETED: [],
  BLOCKED: [],
  REJECTED: [],
  FAILED: ["ROLLBACK_PENDING"],
  ROLLBACK_PENDING: ["ROLLED_BACK", "FAILED"],
  ROLLED_BACK: [],
};

const DEFAULT_CLOCK: Clock = { now: () => new Date() };
const DEFAULT_IDS: IdGenerator = {
  next: (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
};

export class VerificationGateway {
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly snapshots = new Map<string, GatewaySnapshot>();

  public constructor(private readonly deps: GatewayDependencies) {
    this.clock = deps.clock ?? DEFAULT_CLOCK;
    this.ids = deps.ids ?? DEFAULT_IDS;
  }

  public async submit(intent: TaskIntent): Promise<GatewaySnapshot> {
    this.validateIntent(intent);
    this.snapshots.set(intent.taskId, { taskId: intent.taskId, state: "RECEIVED", intent });

    try {
      await this.transition(intent.taskId, "PARSED", intent.requestedBy, "Intent schema accepted");
      const evidence = await this.deps.observer.observe(intent);
      this.patch(intent.taskId, { evidence });
      await this.transition(intent.taskId, "OBSERVED", "observer", "Read-only evidence collected");

      const dissent = await this.deps.verifier.dissent(intent, evidence);
      this.patch(intent.taskId, { dissent });
      await this.transition(intent.taskId, "DISSENTED", "verifier", "Counter-evidence and alternative interpretations recorded");

      const verification = await this.deps.verifier.verify(intent, evidence);
      this.patch(intent.taskId, { verification });
      if (!verification.approved) {
        await this.transition(intent.taskId, "BLOCKED", "verifier", "Verification policy did not approve the request");
        return this.get(intent.taskId);
      }

      const plan = await this.deps.planner.plan(intent, verification, dissent);
      this.patch(intent.taskId, { error: plan.summary });
      await this.transition(intent.taskId, "PLANNED", "planner", "Bounded execution plan created");
      await this.transition(intent.taskId, "AWAITING_AUTHORIZATION", "gateway", "Waiting for scoped authorization");

      const authorization = await this.deps.authorizer.authorize(intent, verification, plan);
      this.patch(intent.taskId, { authorization });
      if (!authorization.approved) {
        await this.transition(intent.taskId, "REJECTED", authorization.approver, "Authorization denied");
        return this.get(intent.taskId);
      }

      await this.transition(intent.taskId, "AUTHORIZED", authorization.approver, "Scoped authorization granted");
      const execution = await this.deps.executor.execute(intent, authorization);
      this.patch(intent.taskId, { execution });

      if (!execution.success) {
        await this.transition(intent.taskId, "FAILED", "executor", "Executor reported failure");
        return await this.rollbackIfNeeded(intent.taskId, execution);
      }

      await this.transition(intent.taskId, "EXECUTING", "executor", "Authorized execution started");
      await this.transition(intent.taskId, "TESTING", "gateway", "Execution completed; verification tests started");
      const tests = await this.deps.tester.test(intent, execution);
      this.patch(intent.taskId, { tests });

      if (!tests.passed) {
        await this.transition(intent.taskId, "ROLLBACK_PENDING", "tester", "Post-execution tests failed");
        return await this.rollbackAndComplete(intent.taskId, execution);
      }

      const attestation = this.createAttestation(intent, execution, tests, evidence);
      this.patch(intent.taskId, { attestation });
      await this.transition(intent.taskId, "ATTESTED", "tester", "Post-execution checks passed");
      await this.transition(intent.taskId, "COMPLETED", "gateway", "Task completed with attested results");
      return this.get(intent.taskId);
    } catch (error) {
      return await this.handleFailure(intent.taskId, error);
    }
  }

  public get(taskId: string): GatewaySnapshot {
    const snapshot = this.snapshots.get(taskId);
    if (!snapshot) throw new GatewayError(`Unknown task: ${taskId}`, "INVALID_INTENT");
    return snapshot;
  }

  private validateIntent(intent: TaskIntent): void {
    if (!intent.taskId || !intent.requestedBy || !intent.objective || !intent.target) {
      throw new GatewayError("taskId, requestedBy, objective, and target are required", "INVALID_INTENT");
    }
    if (intent.impact === "high" && intent.dryRun === false && !intent.authorizationRef) {
      throw new GatewayError("High-impact execution requires an authorization reference", "POLICY_BLOCK");
    }
    if (!Number.isFinite(Date.parse(intent.createdAt))) {
      throw new GatewayError("createdAt must be an ISO timestamp", "INVALID_INTENT");
    }
  }

  private async transition(taskId: string, to: GatewayState, actor: string, reason: string): Promise<void> {
    const current = this.get(taskId);
    if (!TRANSITIONS[current.state].includes(to)) {
      throw new GatewayError(`Invalid transition ${current.state} -> ${to}`, "INVALID_TRANSITION");
    }
    const event: ProvenanceEvent = {
      eventId: this.ids.next("evt"),
      taskId,
      from: current.state,
      to,
      actor,
      at: this.clock.now().toISOString(),
      dataRefs: this.dataRefs(current),
      reason,
    };
    await this.deps.provenance.append(event);
    this.snapshots.set(taskId, { ...current, state: to });
  }

  private patch(taskId: string, patch: Partial<GatewaySnapshot>): void {
    const current = this.get(taskId);
    this.snapshots.set(taskId, { ...current, ...patch });
  }

  private dataRefs(snapshot: GatewaySnapshot): readonly string[] {
    const refs: string[] = [];
    if (snapshot.intent) refs.push(`intent:${snapshot.taskId}`);
    if (snapshot.evidence) refs.push(...snapshot.evidence.map((item) => `evidence:${item.id}`));
    if (snapshot.verification) refs.push(`verification:${snapshot.taskId}`);
    if (snapshot.authorization) refs.push(`authorization:${snapshot.authorization.decisionId}`);
    if (snapshot.execution) refs.push(`execution:${snapshot.execution.taskId}`);
    if (snapshot.attestation) refs.push(`attestation:${snapshot.attestation.attestationId}`);
    return refs;
  }

  private createAttestation(intent: TaskIntent, execution: ExecutionResult, tests: TestReport, evidence: readonly EvidenceRecord[]): Attestation {
    return {
      taskId: intent.taskId,
      result: "passed",
      evidenceIds: evidence.map((item) => item.id),
      tests: tests.checks,
      generatedAt: this.clock.now().toISOString(),
      attestationId: this.ids.next("att"),
      rollbackRef: execution.rollbackRef,
    };
  }

  private async rollbackIfNeeded(taskId: string, execution: ExecutionResult): Promise<GatewaySnapshot> {
    if (!execution.changed || !execution.rollbackRef) return this.get(taskId);
    await this.transition(taskId, "ROLLBACK_PENDING", "gateway", "Failed execution changed state and has a rollback reference");
    return this.rollbackAndComplete(taskId, execution);
  }

  private async rollbackAndComplete(taskId: string, execution: ExecutionResult): Promise<GatewaySnapshot> {
    try {
      await this.deps.rollback.rollback(execution);
      await this.transition(taskId, "ROLLED_BACK", "rollback", "Rollback completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.patch(taskId, { error: `Rollback failed: ${message}` });
      if (!isTerminalState(this.get(taskId).state)) {
        await this.transition(taskId, "FAILED", "rollback", "Rollback failed; manual intervention required");
      }
    }
    return this.get(taskId);
  }

  private async handleFailure(taskId: string, error: unknown): Promise<GatewaySnapshot> {
    const message = error instanceof Error ? error.message : String(error);
    const current = this.get(taskId);
    this.patch(taskId, { error: message });
    if (!isTerminalState(current.state) && current.state !== "ROLLBACK_PENDING") {
      await this.transition(taskId, "FAILED", "gateway", message);
    }
    return this.get(taskId);
  }
}
