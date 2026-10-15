# Project5 Step 8: actual generated-code repairs

Prepared 13 October 2026 against the generated `project5-generation` checkout. The generated output needed concrete repairs; the main runbook listed the categories but did not implement these changes automatically.

This is the **managed baseline** checkpoint. The managed auth definition, web/native clients, identity pool, Agents group and Connections table are preserved for later reviewed ownership planning. This checkout has not been deployed. Step 9 must separately convert selected state to B references before reference-based QA. Do not run generation or Gen1 `prepare`/`push` in this now-Gen2 folder.

## Changes applied

| Area | Generated problem | Applied correction |
|---|---|---|
| Package/toolchain | Gen1 prepare/CLI remained; root typecheck excluded the new Gen2 paths | Removed Gen1 lifecycle/CLI dependencies, archived Gen1 scripts, pinned the reviewed Gen2 toolchain, refreshed the lockfile, and checked `amplify/**/*.ts` |
| GraphQL dependency | Installing the simulator hoisted GraphQL 14, causing cross-module directive errors in Gen2 code generation | Pinned root GraphQL 15.10.3 for the schema/code-generation packages; retained the VTL simulator for authorization checks |
| Lambda entry points | CommonJS `index.js` ran below `amplify/package.json` with `type: module` | Replaced entries with ESM `handler.js` exports of the unchanged canonical `.cjs` modules under `src/`; removed stale duplicated runtime copies |
| Function names | Forced `${name}-${branch}` CloudFormation names could collide with existing functions | Removed forced CfnFunction names; use Project5-prefixed Gen2 factory names and actual construct references |
| REST | Unauthenticated `ANY`/proxy routes replaced the original overridden authorization | Restored seven Cognito-protected methods, one Agents-authorized GET, and four unauthenticated Lambda-proxy OPTIONS routes; restored authorizer cache TTL 0 and gateway error CORS |
| GraphQL workflows | `@function` names referred to guessed branch-suffixed names without a function map | Bound `ticketWorkflow` through `defineData.functions` and stable schema names |
| GraphQL result auth | Non-model summary/comment return types lacked Cognito directives | Added `@aws_cognito_user_pools` to both result types |
| Creator ownership | Generated slot insertion was fragile and static-group creation could override ownership | Seed the verified creator in the create pipeline request before auth, reusing the preserved Gen1 owner-setting VTL; keep one final request payload |
| Model table | Mapping selected `pftest`, while the destination branch is `main` | Set mapping to the reviewed destination branch while retaining B's exact Ticket table name |
| Import configuration | Default provider configuration could mismatch B's KMS encryption/protection | Match enabled SSE, retain/deletion protection and non-destructive updates; B's live key manager is AWS, key enabled, stream `NEW_AND_OLD_IMAGES`, id string key and on-demand billing |
| Importer compatibility | Installed model transformer 3.5.1 omitted live SSE status from its comparison | Reused the bounded status-preservation patch; tests still reject disabled/updating/missing encryption, wrong keys/streams and removed protection |
| WebSocket | `backend.functions.*`, role objects, and a Gen1 API stream export were invalid for Gen2 | Use actual Gen2 functions and table stream handles; remove the old standalone stream policy/mapping from the custom construct |
| IAM/environment | Captured B IDs and environment variables were disconnected from the managed definitions; grants were missing | Wire table/pool/client/Connections variables from actual constructs; grant table, stream, group-membership and callback permissions |
| Stack dependencies | APIs and functions could form cross-stack cycles | Place related functions/custom REST/WebSocket resources in the data resource group; synthesis checks the resulting assembly |
| Notifications | A new enabled consumer would broadcast alongside B | Keep the new event-source mapping disabled until the later reviewed single-consumer handoff |
| Connections safeguards | Generated table omitted B's enabled deletion protection | Preserve TTL/key/billing/retention and enable deletion protection on the managed placeholder definition |
| Outputs/frontend | REST output shape and inherited labels/config could point to the wrong application | Emit the application's expected REST/WebSocket/table outputs, use Project5 labels, require explicit Project5 outputs and remove fallback to copied Gen1 output evidence |
| CI/deploy | Inherited Gen1 scripts and generated Hosting commands were inappropriate for this checkpoint | CI validates the Gen2 baseline; no backend deployment is triggered. Archived old Gen1 deployment/hosting/smoke scripts stay outside active package commands |

The auth resource retains its generated managed declaration and escape-hatch call. The only compatibility reconciliation added there removes unsupported login-provider configuration for this email-only identity pool. `postRefactor()` remains disabled; its generated marker is not a complete future physical-name/owner reconciliation implementation.

## Run the checks

These checks passed on 13 October 2026:

- A fresh `npm ci` from the repaired lockfile completed successfully, including the bounded importer patch.
- `npm run typecheck` passed.
- `npm test` passed all 39 tests, including runtime authorization, creator ownership, notification behavior, Lambda packaging and encryption-import validation.
- `npm run synth` passed the managed-backend assertions.
- `npm run frontend:build` passed with explicitly supplied **offline sample outputs**. This verifies packaging, not connectivity to a deployed Project5 backend.

Results are recorded in [the validation record](../evidence/step8-validation.json) and [the synthesis record](../evidence/synthesis.json).

```bash
cd "$PROJECT5_DIR"
npm ci
npm run validate
```

For this already-repaired checkout, use the commands above. Do not repeat the main runbook's illustrative dependency-reset commands or copy the REST factory again: the repaired lockfile and implementation are already in place.

`npm run validate` runs TypeScript, the application/package/security tests and managed-mode synthesis. The synthesis helper uses `main` and `dprojectfivepreview` unless the actual destination app ID is supplied. This preview identifier is for local synthesis only.

The helper verifies the REST authorization counts, WebSocket connect authorization, nine GraphQL operations, creator assignment, required IAM actions, one disabled stream mapping, the selected B model table and protection/retention settings. It also checks the managed pool/client/identity/group/table layout. It does not deploy or establish runtime cloud behavior.

The new `scripts/patch-amplify-import.cjs` runs after install and is bounded to model-transformer 3.5.1. Review the compatibility workaround before upgrading those packages; it does not skip table validation or make the imported provider passive.

## Save the baseline, then proceed to Step 9

1. Review the code and validation result. Raw output and pre-repair package/config snapshots are preserved in the private evidence directory.
2. Save the repaired managed baseline as a reviewed local commit/private archive. Keep the original raw output separately. Do not publish private cloud/session/configuration evidence.
3. Follow Step 9's reference adaptation for B's resources. Do not deploy this managed baseline as the reference-QA configuration: it deliberately contains managed pool/Connections definitions for later cutover planning.
4. Inspect the imported-model provider permissions/configuration during long coexistence. Setting `allowDestructiveGraphqlSchemaUpdates: false` does not prevent all in-place table changes.
5. Configure the new QA frontend origin, actual C outputs, runtime secrets and single stream consumer before live testing. The current safe CORS allowlist contains localhost; no original A website is republished.
6. Perform the runbook's live allow/deny/session/notification tests and deployment-plan review. The future ownership refactor, physical-name reconciliation and rollback remain separate, unexecuted operations.

## Verification limits

Local checks for that review used Node 24.16.0 with Lambda/build target Node 22. Live work during that review was limited to read-only descriptions of B's two tables and KMS key. No AWS stack/resource update, new pool/table, ownership movement, unlock, hosting publish or Git push was executed.

## 15 October follow-up: clean-install lockfile repair

The reported `npm ci` failure was reproduced on Node 22.22.0 with npm 10.9.4 and npm 11.13.0. Switching npm versions alone did not fix it. The lockfile omitted four nested `@opentelemetry/core@2.0.0` entries required by Amplify's bundled OpenTelemetry dependencies. A package-lock-only install also restored four bundled CDK dependency entries (`jsonschema` and `semver` in each Amplify construct).

The repair added eight entries without changing any existing locked package version or `package.json`. It was generated with `npm@11.13.0 install --package-lock-only --ignore-scripts --no-audit --no-fund`; normal installs should continue using `npm ci` with the repaired lockfile. The peer-dependency warnings remain separate from the corrected `EUSAGE` failure. Do not delete the lockfile or use `--force`/`--legacy-peer-deps` to bypass this failure.

A full clean install with the user's Node 22.22.0/npm 10.9.4 completed, including the importer postinstall patch. TypeScript, all 40 current tests, reference synthesis for C (`d3bsim6mrnq854/main`) and frontend packaging from C's local outputs passed on Node 22. These are local installation/build checks, not a GitHub deployment or live browser QA result. Include the repaired `package-lock.json` in the next reviewed commit before CI uses it.

The GraphQL transformer retains source warnings about root-field auth and possible owner reassignment on updates. Lambda/creator tests cover the reviewed behavior, but this checkpoint does not change the original GraphQL update-ownership policy or prove live authorization. Review that policy in the actual QA security matrix.
