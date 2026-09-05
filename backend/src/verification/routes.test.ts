import assert from "assert";
import Fastify from "fastify";
import { registerVerificationRoutes } from "./routes";

async function main(): Promise<void> {
  const server = Fastify();
  await registerVerificationRoutes(server);
  const response = await server.inject({ method: "GET", url: "/verification/checksum" });
  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body) as { finalChecksum: string; operationalChecksum: string; commands: string[] };
  assert.ok(body.finalChecksum.includes("SOURCE=CURRENT"));
  assert.ok(body.operationalChecksum.includes("OBSERVE→VERIFY"));
  assert.deepStrictEqual(body.commands, ["OBSERVE", "DIRECT", "EXPAND", "FOCUS", "TRANSCEND"]);
  await server.close();
  console.log("verification route tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
