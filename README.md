# Project5 managed Gen2 baseline

Step 8 repairs for the generated Gen1 `pftest` backend. This preserves a managed auth/Connections baseline for later ownership planning. It is not deployed and must not be used for reference-based QA until Step 9 replaces all selected managed state with B references.

Run `npm run validate`. Synthesis uses main and a local preview app ID until GEN2_APP_ID is supplied. The Ticket model maps to B; notifications remain disabled until a reviewed single-consumer handoff.

See `docs/STEP8-REPAIRS.md` for changes, checks and next steps. Gen1 CLI operations belong in the intact control checkout.
