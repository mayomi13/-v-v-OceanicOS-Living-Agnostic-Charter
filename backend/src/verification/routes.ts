import { FastifyInstance } from "fastify";
import { OMEGA_TOTAL_COMPRESSION } from "./omega-total";

/**
 * Registers read-only verification metadata routes. These routes expose no
 * credentials, telemetry, or execution capability.
 */
export async function registerVerificationRoutes(server: FastifyInstance): Promise<void> {
  server.get("/verification/checksum", async () => ({
    stateRoot: OMEGA_TOTAL_COMPRESSION.stateRoot,
    kernelPhase: OMEGA_TOTAL_COMPRESSION.kernelPhase,
    commands: OMEGA_TOTAL_COMPRESSION.commands,
    creationEngine: OMEGA_TOTAL_COMPRESSION.creationEngine,
    finalChecksum: OMEGA_TOTAL_COMPRESSION.finalChecksum,
    operationalChecksum: OMEGA_TOTAL_COMPRESSION.operationalChecksum,
    stewardshipAxiom: OMEGA_TOTAL_COMPRESSION.stewardshipAxiom,
  }));
}
