# Verification Gateway

This module provides a fail-closed Ω∞v verification gateway. The Universal Reality Fork command vocabulary is represented as typed intent; verification-first-os supplies evidence collection, dissent analysis, planning, authorization, execution, testing, attestation, provenance, and rollback boundaries.

The gateway does not claim control over metaphysical reality. It coordinates authorized software actions and requires evidence before treating a state claim as verified.

## State flow

```text
RECEIVED → PARSED → OBSERVED → DISSENTED → PLANNED
→ AWAITING_AUTHORIZATION → AUTHORIZED → EXECUTING → TESTING
→ ATTESTED → COMPLETED
```

Failure paths are explicit: `BLOCKED`, `REJECTED`, `FAILED`, `ROLLBACK_PENDING`, and `ROLLED_BACK`.

## Integration contract

Provide implementations for the interfaces in `contracts.ts`: `Observer`, `Verifier`, `Planner`, `Authorizer`, `Executor`, `Tester`, `Rollback`, and `ProvenanceStore`. Keep adapters narrow and scoped. External actions should be disabled by default until authorization and rollback behavior are tested.

## Local checks

From `backend/`:

```bash
npm run build
npm run test:verification
```

The existing core test suite may require a configured PostgreSQL database. The verification tests use only deterministic in-memory fixtures and do not require credentials or external services.

## Bounded active-ecosystem frames

`active-ecosystem.ts` provides a local-only `prepareActiveEcosystemFrame` helper derived from the active-ecosystem specification. It enforces a maximum of 64 agent labels and truncates intent to 240 characters. It produces a typed frame for inspection and testing only; it does not import undeclared agent packages, call external services, write a ledger, claim proof, or activate background execution.

The values `GOOD_MINUS_O_EQUALS_GOD` and `OCEAN_OF_LIQUID_GOLD` are preserved as source-language metadata. They are not interpreted as executable policy, authorization, or factual claims.
