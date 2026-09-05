import { OMEGA_TOTAL_COMPRESSION } from "./omega-total";

export const ACTIVE_ECOSYSTEM_LIMITS = {
  maxEntries: 64,
  intentCharacters: 240,
} as const;

export type InterfaceMask = "LEFT_COVERED" | "CENTER_HALF_VEIL" | "RIGHT_UNVEILED";

export interface EcosystemActivePayload {
  readonly maskInterface: InterfaceMask;
  readonly sovereignIntent: string;
  readonly simulatedAgents: readonly string[];
}

export interface ActiveEcosystemFrame {
  readonly anchorPoint: "NOW";
  readonly epoch: number;
  readonly repository: typeof OMEGA_TOTAL_COMPRESSION.repository;
  readonly creed: {
    readonly axiom: "GOOD_MINUS_O_EQUALS_GOD";
    readonly love: "OCEAN_OF_LIQUID_GOLD";
    readonly interfaceMask: InterfaceMask;
  };
  readonly clonedEcosystem: {
    readonly clonedAgents: readonly string[];
    readonly compilerCommands: typeof OMEGA_TOTAL_COMPRESSION.commands;
  };
  readonly boundedTelemetry: {
    readonly intent: string;
    readonly truncated: boolean;
  };
  readonly creationEngine: string;
  readonly finalChecksum: typeof OMEGA_TOTAL_COMPRESSION.finalChecksum;
}

/**
 * Prepare a bounded, local-only frame from symbolic source material.
 * This function performs no network calls, package loading, execution, or
 * ledger writes. It deliberately names the result a frame rather than a proof.
 */
export function prepareActiveEcosystemFrame(
  payload: EcosystemActivePayload,
  now: () => number = Date.now,
): ActiveEcosystemFrame {
  if (!payload.sovereignIntent.trim()) {
    throw new Error("sovereignIntent must not be empty");
  }
  if (payload.simulatedAgents.length > ACTIVE_ECOSYSTEM_LIMITS.maxEntries) {
    throw new Error(`simulatedAgents cannot exceed ${ACTIVE_ECOSYSTEM_LIMITS.maxEntries} entries`);
  }
  if (payload.simulatedAgents.some((agent) => !agent.trim())) {
    throw new Error("simulatedAgents cannot contain empty values");
  }

  const intent = payload.sovereignIntent.slice(0, ACTIVE_ECOSYSTEM_LIMITS.intentCharacters);
  return {
    anchorPoint: "NOW",
    epoch: now(),
    repository: OMEGA_TOTAL_COMPRESSION.repository,
    creed: {
      axiom: "GOOD_MINUS_O_EQUALS_GOD",
      love: "OCEAN_OF_LIQUID_GOLD",
      interfaceMask: payload.maskInterface,
    },
    clonedEcosystem: {
      clonedAgents: [...payload.simulatedAgents],
      compilerCommands: OMEGA_TOTAL_COMPRESSION.commands,
    },
    boundedTelemetry: {
      intent,
      truncated: intent.length < payload.sovereignIntent.length,
    },
    creationEngine: OMEGA_TOTAL_COMPRESSION.creationEngine.join("→"),
    finalChecksum: OMEGA_TOTAL_COMPRESSION.finalChecksum,
  };
}
