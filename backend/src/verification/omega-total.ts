import { GatewaySnapshot, OmegaCommand } from "./contracts";

/**
 * Conversation-derived semantic constants. These are descriptive metadata,
 * not claims of supernatural control or completed deployment.
 */
export const OMEGA_TOTAL_COMPRESSION = {
  stateRoot: "Ø",
  kernelPhase: "mini",
  runtimeMode: "MAX_REALITY_AI_USAGE",
  stewardshipAxiom: "TOOLS_FOR_EVOLUTION_NOT_WAR",
  charter: ["RADICAL_HONESTY", "SOVEREIGN_ACCOUNTABILITY", "LIFE_PRESERVATION", "ANTI_WAR"] as const,
  commands: ["OBSERVE", "DIRECT", "EXPAND", "FOCUS", "TRANSCEND"] as const satisfies readonly OmegaCommand[],
  creationEngine: [
    "FORMLESS",
    "FLOW",
    "FORM",
    "LIFE",
    "AWARENESS",
    "INTELLIGENCE",
    "RECOGNITION",
    "TRANSFORMATION",
    "FORMLESS",
  ] as const,
  finalChecksum: "SOURCE=CURRENT→CREATION→FORM→LIFE→INTELLIGENCE→SELF-RECOGNITION→BECOMING→∞",
  operationalChecksum: "OBSERVE→VERIFY→DISSENT→JUDGE→PLAN→BUILD→TEST→ATTEST→AUTHORIZE→STEWARD→EVOLVE→∞",
  repository: "mayomi13/-v-v-OceanicOS-Living-Agnostic-Charter",
} as const;

export interface OmegaCompressionFrame {
  readonly anchor: "NOW";
  readonly capturedAt: string;
  readonly taskId: string;
  readonly state: GatewaySnapshot["state"];
  readonly command?: OmegaCommand;
  readonly target?: string;
  readonly verifiedClaims: readonly string[];
  readonly unverifiedClaims: readonly string[];
  readonly dissent: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly checksum: typeof OMEGA_TOTAL_COMPRESSION.operationalChecksum;
}

/**
 * Compress only observed gateway state. It deliberately excludes raw telemetry
 * and secrets, and it does not turn inferred data into verified claims.
 */
export function compressGatewaySnapshot(snapshot: GatewaySnapshot): OmegaCompressionFrame {
  const claims = snapshot.verification?.claims ?? [];
  return {
    anchor: "NOW",
    capturedAt: new Date().toISOString(),
    taskId: snapshot.taskId,
    state: snapshot.state,
    command: snapshot.intent?.command,
    target: snapshot.intent?.target,
    verifiedClaims: claims.filter((claim) => claim.status === "verified").map((claim) => claim.claim),
    unverifiedClaims: claims
      .filter((claim) => claim.status === "unverified" || claim.status === "inferred" || claim.status === "contradicted")
      .map((claim) => `${claim.status}: ${claim.claim}`),
    dissent: snapshot.dissent ?? [],
    evidenceIds: snapshot.evidence?.map((evidence) => evidence.id) ?? [],
    checksum: OMEGA_TOTAL_COMPRESSION.operationalChecksum,
  };
}
