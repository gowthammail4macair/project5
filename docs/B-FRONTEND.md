# B / pftest frontend

B has separate S3/CloudFront hosting. Its public URL is recorded in
[`frontend/hosting.json`](../frontend/hosting.json). The original Gen1 A site
at https://d2i2kf1hg91937.cloudfront.net is preserved. C's main site continues
to use its own APIs with the intended shared B reference state during QA.

| Component | B resource |
| --- | --- |
| Cognito pool | `ap-south-1_zgT2JWoBE` |
| Web client | `6ugasqqj1n74lb521orpj047pd` |
| GraphQL API | `yfs4rx4ynvgulalyky2k3zfrxi` |
| REST API | `5pgt9rnw3e` / `pftest` |
| WebSocket API | `a61vb7pyxd` / `pftest` |
| Tickets | `Ticket-yfs4rx4ynvgulalyky2k3zfrxi-pftest` |
| Connections | `Connections-ap-south-1_zgT2JWoBE` |
| Backend owner | `amplify-supportgenone-pftest-eb70f` |
| Hosting stack | `support-d1zija7gqlw461pftest-frontend` |

## Release from this B branch

Use `codex/b-frontend-isolation` in `gowthammail4macair/project5`. Its GitHub
workflow validates B and never runs C's main deployment pipeline. Do not merge
this Gen1 source branch over C's Gen2 main branch.

```bash
npm ci
npm run validate
# One-time hosting setup, or refresh hosting outputs on subsequent releases.
npm run hosting:prepare
# Verify B live identities and data sources; no backend deployment occurs.
npm run frontend:outputs
npm run frontend:build
node scripts/smoke-test.cjs
node scripts/hosting.cjs publish
node scripts/check-hosting.cjs
```

`frontend:outputs` reads B's actual nested stack outputs and checks AppSync's
Cognito pool and DynamoDB/Lambda data sources, all four application Lambda
configurations, and both active tables. `build.json` records the B environment,
resource IDs, exact Git source commit and asset hashes. Build and publish reject
copied A or mixed-environment outputs. Exported outputs stay ignored.

The REST Lambda CORS allowlist must be localhost plus the URL in B's hosting
file. `scripts/prepare-local.cjs` preserves that setting in B's source template.
A new hosting origin requires applying that configuration to B before browser
use; frontend publication alone cannot change backend CORS. Never publish B
through A's hosting stack or run A's preserved deployment workflow.

The smoke suite creates temporary B users and records, verifies owner/Agents
access, REST/GraphQL CRUD and comments, physical DynamoDB records, rejection of
B's token by A's GraphQL API, and WebSocket notifications. Its `finally` cleanup
removes its own users, tickets and sockets. Existing demo users are preserved.

B retains one active stream consumer during reference QA. Source includes the
existing B stream-policy repair and table deletion protection. A later full B
backend deployment must preserve C's authorized WebSocket callback permission
and keep C's duplicate stream consumer disabled.

## Verification

See `evidence/backend-wiring.json`, `evidence/live-smoke.json`,
`evidence/frontend-hosting-checks.json` and `evidence/b-frontend-verification.json`
for the completed deployment checks. Browser evidence is recorded separately
without credentials or JWTs. Test credentials are never committed.
