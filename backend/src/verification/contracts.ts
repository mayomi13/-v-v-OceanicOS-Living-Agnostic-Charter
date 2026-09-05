export const OMEGA_COMMANDS = [
  "OBSERVE",
  "DIRECT",
  "EXPAND",
  "FOCUS",
  "TRANSCEND",
] as const;

export type OmegaCommand = (typeof OMEGA_COMMANDS)[number];
export type Impact = "low" | "medium" | "high";
export type Reversibility = "reversible" | "partially-reversible" | "irreversible";
export type ClaimStatus = "verified" | "inferred" | "unverified" | "contradicted";
export type RiskLevel = "low" | "medium" | "high";

export const TERMINAL_STATES = ["COMPLETED", "REJECTED", "FAILED", "ROLLED_BACK"] as const;
export type TerminalState = (typeof TERMINAL_STATES)[number];

export type GatewayState =
  | "RECEIVED"
  | "PARSED"
  | "OBSERVED"
  | "DISSENTED"
  | "PLANNED"
  | "AWAITING_AUTHORIZATION"
  | "AUTHORIZED"
  | "EXECUTING"
  | "TESTING"
  | "ATTESTED"
  | "COMPLETED"
  | "BLOCKED"
  | "REJECTED"
  | "FAILED"
  | "ROLLBACK_PENDING"
  | "ROLLED_BACK";

export interface TaskIntent {
  readonly taskId: string;
  readonly command: OmegaCommand;
  readonly objective: string;
  readonly target: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly requestedBy: string;
  readonly authorizationRef?: string;
  readonly reversibility: Reversibility;
  readonly impact: Impact;
  readonly dryRun: boolean;
  readonly createdAt: string;
}

export interface EvidenceRecord {
  readonly id: string;
  readonly source: string;
  readonly observedAt: string;
  readonly contentHash: string;
  readonly observations: readonly string[];
  readonly limitations: readonly string[];
  readonly collector: string;
  readonly sensitive: boolean;
}

export interface ClaimAssessment {
  readonly claim: string;
  readonly status: ClaimStatus;
  readonly support: readonly string[];
  readonly dissent: readonly string[];
}

export interface VerificationReport {
  readonly evidenceIds: readonly string[];
  readonly claims: readonly ClaimAssessment[];
  readonly riskLevel: RiskLevel;
  readonly approved: boolean;
  readonly reasons: readonly string[];
  readonly generatedAt: string;
}

export interface AuthorizationDecision {
  readonly approved: boolean;
  readonly approver: string;
  readonly scope: string;
  readonly expiresAt: string;
  readonly rationale: string;
  readonly decisionId: string;
}

export interface ExecutionResult {
  readonly taskId: string;
  readonly success: boolean;
  readonly changed: boolean;
  readonly summary: string;
  readonly outputRefs: readonly string[];
  readonly rollbackRef?: string;
  readonly completedAt: string;
}

export interface TestReport {
  readonly passed: boolean;
  readonly checks: readonly string[];
  readonly failures: readonly string[];
  readonly generatedAt: string;
}

export interface Attestation {
  readonly taskId: string;
  readonly result: "passed" | "failed" | "partial";
  readonly evidenceIds: readonly string[];
  readonly tests: readonly string[];
  readonly generatedAt: string;
  readonly attestationId: string;
  readonly rollbackRef?: string;
}

export interface ProvenanceEvent {
  readonly eventId: string;
  readonly taskId: string;
  readonly from: GatewayState;
  readonly to: GatewayState;
  readonly actor: string;
  readonly at: string;
  readonly dataRefs: readonly string[];
  readonly reason: string;
}

export interface GatewaySnapshot {
  readonly taskId: string;
  readonly state: GatewayState;
  readonly intent?: TaskIntent;
  readonly evidence?: readonly EvidenceRecord[];
  readonly verification?: VerificationReport;
  readonly dissent?: readonly string[];
  readonly authorization?: AuthorizationDecision;
  readonly execution?: ExecutionResult;
  readonly tests?: TestReport;
  readonly attestation?: Attestation;
  readonly error?: string;
}

export interface Observer {
  observe(intent: TaskIntent): Promise<readonly EvidenceRecord[]>;
}

export interface Verifier {
  verify(intent: TaskIntent, evidence: readonly EvidenceRecord[]): Promise<VerificationReport>;
  dissent(intent: TaskIntent, evidence: readonly EvidenceRecord[]): Promise<readonly string[]>;
}

export interface Planner {
  plan(intent: TaskIntent, verification: VerificationReport, dissent: readonly string[]): Promise<{ summary: string; steps: readonly string[] }>;
}

export interface Authorizer {
  authorize(intent: TaskIntent, verification: VerificationReport, plan: { summary: string; steps: readonly string[] }): Promise<AuthorizationDecision>;
}

export interface Executor {
  execute(intent: TaskIntent, authorization: AuthorizationDecision): Promise<ExecutionResult>;
}

export interface Tester {
  test(intent: TaskIntent, execution: ExecutionResult): Promise<TestReport>;
}

export interface Rollback {
  rollback(execution: ExecutionResult): Promise<void>;
}

export interface ProvenanceStore {
  append(event: ProvenanceEvent): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(prefix: string): string;
}

export interface GatewayDependencies {
  readonly observer: Observer;
  readonly verifier: Verifier;
  readonly planner: Planner;
  readonly authorizer: Authorizer;
  readonly executor: Executor;
  readonly tester: Tester;
  readonly rollback: Rollback;
  readonly provenance: ProvenanceStore;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
}

export class GatewayError extends Error {
  public constructor(
    message: string,
    public readonly code: "INVALID_INTENT" | "INVALID_TRANSITION" | "POLICY_BLOCK" | "EXECUTION_FAILED" | "VERIFICATION_FAILED",
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

export function isTerminalState(state: GatewayState): state is TerminalState {
  return (TERMINAL_STATES as readonly string[]).includes(state);
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
