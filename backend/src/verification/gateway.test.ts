import assert from "assert";
import { VerificationGateway } from "./gateway";
import { compressGatewaySnapshot, OMEGA_TOTAL_COMPRESSION } from "./omega-total";
import {
  AuthorizationDecision,
  EvidenceRecord,
  ExecutionResult,
  GatewayDependencies,
  Observer,
  Planner,
  ProvenanceEvent,
  TaskIntent,
  TestReport,
  VerificationReport,
} from "./contracts";

const intent = (overrides: Partial<TaskIntent> = {}): TaskIntent => ({
  taskId: "task_test_1",
  command: "DIRECT",
  objective: "Apply a reversible local change",
  target: "sandbox/project",
  parameters: { preview: true },
  requestedBy: "test-user",
  reversibility: "reversible",
  impact: "low",
  dryRun: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

function dependencies(options: {
  approved?: boolean;
  authorized?: boolean;
  testsPassed?: boolean;
  executionSuccess?: boolean;
  changed?: boolean;
} = {}): GatewayDependencies & { events: ProvenanceEvent[]; rolledBack: boolean } {
  const events: ProvenanceEvent[] = [];
  let rolledBack = false;
  const evidence: EvidenceRecord = {
    id: "evidence_1",
    source: "test-fixture",
    observedAt: new Date().toISOString(),
    contentHash: "sha256:test",
    observations: ["fixture is available"],
    limitations: ["synthetic evidence"],
    collector: "test",
    sensitive: false,
  };
  const verification: VerificationReport = {
    evidenceIds: [evidence.id],
    claims: [{ claim: "fixture is available", status: "verified", support: [evidence.id], dissent: [] }],
    riskLevel: "low",
    approved: options.approved ?? true,
    reasons: options.approved === false ? ["test policy block"] : [],
    generatedAt: new Date().toISOString(),
  };
  const authorization: AuthorizationDecision = {
    approved: options.authorized ?? true,
    approver: "test-authorizer",
    scope: "sandbox/project",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    rationale: "test decision",
    decisionId: "decision_1",
  };
  const execution: ExecutionResult = {
    taskId: "task_test_1",
    success: options.executionSuccess ?? true,
    changed: options.changed ?? false,
    summary: "test execution",
    outputRefs: [],
    rollbackRef: options.changed ? "rollback_1" : undefined,
    completedAt: new Date().toISOString(),
  };
  const tests: TestReport = {
    passed: options.testsPassed ?? true,
    checks: ["contract test"],
    failures: options.testsPassed === false ? ["intentional failure"] : [],
    generatedAt: new Date().toISOString(),
  };

  return {
    events,
    get rolledBack() { return rolledBack; },
    observer: { observe: async () => [evidence] } as Observer,
    verifier: {
      dissent: async () => [],
      verify: async () => verification,
    },
    planner: {
      plan: async () => ({ summary: "test plan", steps: ["execute fixture"] }),
    } as Planner,
    authorizer: {
      authorize: async () => authorization,
    },
    executor: {
      execute: async () => execution,
    },
    tester: {
      test: async () => tests,
    },
    rollback: {
      rollback: async () => { rolledBack = true; },
    },
    provenance: {
      append: async (event) => { events.push(event); },
    },
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    ids: { next: (prefix) => `${prefix}_test` },
  };
}

async function testCompletesWithAttestation(): Promise<void> {
  const deps = dependencies();
  const result = await new VerificationGateway(deps).submit(intent());
  assert.strictEqual(result.state, "COMPLETED");
  assert.strictEqual(result.attestation?.result, "passed");
  assert.deepStrictEqual(deps.events.map((event) => event.to), [
    "PARSED", "OBSERVED", "DISSENTED", "PLANNED", "AWAITING_AUTHORIZATION",
    "AUTHORIZED", "EXECUTING", "TESTING", "ATTESTED", "COMPLETED",
  ]);
}

async function testBlocksUnverifiedIntent(): Promise<void> {
  const deps = dependencies({ approved: false });
  const result = await new VerificationGateway(deps).submit(intent({ taskId: "task_blocked" }));
  assert.strictEqual(result.state, "BLOCKED");
  assert.strictEqual(result.execution, undefined);
}

async function testRejectsUnauthorizedIntent(): Promise<void> {
  const deps = dependencies({ authorized: false });
  const result = await new VerificationGateway(deps).submit(intent({ taskId: "task_rejected" }));
  assert.strictEqual(result.state, "REJECTED");
  assert.strictEqual(result.execution, undefined);
}

async function testCompressionPreservesVerificationBoundaries(): Promise<void> {
  const deps = dependencies();
  const result = await new VerificationGateway(deps).submit(intent({ taskId: "task_compress" }));
  const frame = compressGatewaySnapshot({
    ...result,
    verification: {
      ...result.verification!,
      claims: [
        { claim: "observed fact", status: "verified", support: ["evidence_1"], dissent: [] },
        { claim: "unconfirmed inference", status: "inferred", support: [], dissent: ["not independently checked"] },
      ],
    },
  });
  assert.strictEqual(frame.checksum, OMEGA_TOTAL_COMPRESSION.operationalChecksum);
  assert.deepStrictEqual(frame.verifiedClaims, ["observed fact"]);
  assert.deepStrictEqual(frame.unverifiedClaims, ["inferred: unconfirmed inference"]);
}

async function testRollsBackFailedTests(): Promise<void> {
  const deps = dependencies({ testsPassed: false, changed: true });
  const result = await new VerificationGateway(deps).submit(intent({ taskId: "task_rollback" }));
  assert.strictEqual(result.state, "ROLLED_BACK");
  assert.strictEqual(deps.rolledBack, true);
}

async function main(): Promise<void> {
  await testCompletesWithAttestation();
  await testBlocksUnverifiedIntent();
  await testRejectsUnauthorizedIntent();
  await testCompressionPreservesVerificationBoundaries();
  await testRollsBackFailedTests();
  console.log("verification gateway tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
