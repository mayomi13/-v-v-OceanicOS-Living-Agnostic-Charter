import assert from "assert";
import {
  ACTIVE_ECOSYSTEM_LIMITS,
  prepareActiveEcosystemFrame,
} from "./active-ecosystem";

const basePayload = {
  maskInterface: "CENTER_HALF_VEIL" as const,
  sovereignIntent: "Observe and verify the current repository state before creation.",
  simulatedAgents: ["observer", "verifier", "remember"],
};

function testBuildsBoundedFrame(): void {
  const frame = prepareActiveEcosystemFrame(basePayload, () => 123);
  assert.strictEqual(frame.anchorPoint, "NOW");
  assert.strictEqual(frame.epoch, 123);
  assert.strictEqual(frame.boundedTelemetry.truncated, false);
  assert.deepStrictEqual(frame.clonedEcosystem.clonedAgents, basePayload.simulatedAgents);
  assert.strictEqual(frame.creationEngine, "FORMLESS→FLOW→FORM→LIFE→AWARENESS→INTELLIGENCE→RECOGNITION→TRANSFORMATION→FORMLESS");
}

function testTruncatesIntent(): void {
  const frame = prepareActiveEcosystemFrame({
    ...basePayload,
    sovereignIntent: "x".repeat(ACTIVE_ECOSYSTEM_LIMITS.intentCharacters + 20),
  });
  assert.strictEqual(frame.boundedTelemetry.intent.length, ACTIVE_ECOSYSTEM_LIMITS.intentCharacters);
  assert.strictEqual(frame.boundedTelemetry.truncated, true);
}

function testRejectsOversizedAgentSet(): void {
  assert.throws(() => prepareActiveEcosystemFrame({
    ...basePayload,
    simulatedAgents: Array.from({ length: ACTIVE_ECOSYSTEM_LIMITS.maxEntries + 1 }, (_, i) => `agent-${i}`),
  }), /cannot exceed/);
}

function testRejectsEmptyIntent(): void {
  assert.throws(() => prepareActiveEcosystemFrame({ ...basePayload, sovereignIntent: "  " }), /must not be empty/);
}

testBuildsBoundedFrame();
testTruncatesIntent();
testRejectsOversizedAgentSet();
testRejectsEmptyIntent();
console.log("active ecosystem tests passed");
