# Project5 GitHub Actions: setup and live verification

Recorded 15 October 2026 for account **112097210422**, Region **ap-south-1**. This is the **reference-QA phase**: B remains the native CloudFormation owner of the existing Cognito and DynamoDB resources.

## Current deployment

| Item | Value |
|---|---|
| Repository / deployment branch | `gowthammail4macair/project5` / `main` |
| C Amplify app | `d3bsim6mrnq854` |
| C backend root | `amplify-d3bsim6mrnq854-main-branch-62962b63d8` |
| Frontend | https://main.d3bsim6mrnq854.amplifyapp.com |
| GitHub AWS role | `arn:aws:iam::112097210422:role/Project5GitHubDeploy` |
| GitHub deployment switch | `PROJECT5_DEPLOY_ENABLED=true` |
| Amplify main Auto-build | Disabled; GitHub explicitly starts the Hosting release after backend success |
| B source environment | `supportgenone/pftest` |
| Existing Cognito pool | `ap-south-1_zgT2JWoBE` |
| Existing Ticket table | `Ticket-yfs4rx4ynvgulalyky2k3zfrxi-pftest` |
| Existing Connections table | `Connections-ap-south-1_zgT2JWoBE` |

## What changed and why

1. Repaired the inconsistent dependency lockfile. The repair adds missing nested dependency records and preserves existing package versions. The previous GitHub runs failed at `npm ci`; the repaired lockfile passed on Linux.
2. Created the GitHub OIDC role and configured 14 repository variables. The trust is restricted to this repository's immutable owner/repository IDs and `refs/heads/main`. No permanent AWS access keys are stored in GitHub.
3. Enabled `validate → deploy` in `.github/workflows/deploy.yml`: Node 22/npm 11.13.0, clean install, TypeScript/tests/synthesis, live account/app/repository/branch checks, then `ampx pipeline-deploy`.
4. Chained an Amplify Hosting release after backend success. Hosting fetches C's existing outputs and packages the frontend. It does not run another backend deployment. The workflow verifies the Hosting job commit and the public `build.json` commit plus B's pool/client IDs.
5. Granted B's active stream Lambda callback access to C's exact WebSocket API/stage through B's source and `amplify push`. C's stream mapping stays disabled, so B remains the sole active broadcaster.
6. Declared deletion protection in B's source for both tables. The first normal B push reset the earlier out-of-band settings; the source correction restored both to `true`, preserving physical table IDs. B local commit: `3cedffe`; its source patch is [project5-B-qa-prerequisites.patch](project5-B-qa-prerequisites.patch). The Gen1 repository was not pushed.
7. Added `PROJECT5_CICD_PROBE_20261015` to C's REST Lambda wrapper. Each invocation logs the Lambda request ID, HTTP method and route. It does not log tokens, request bodies or passwords.
8. Fixed the frontend's source repository URL, which had been relative to the website's domain.

Detailed one-time setup and repeatable commands: [GITHUB-ACTIONS-DEPLOYMENT.md](GITHUB-ACTIONS-DEPLOYMENT.md).

## Actual GitHub runs

| Commit | Trigger / run | Result |
|---|---|---|
| `aa81be8e731db9665dd4311fbf24ea01097ef48f` | [Setup push — 38678962163](https://github.com/gowthammail4macair/project5/actions/runs/38678962163) | Validation passed; deployment intentionally skipped while disabled |
| `aa81be8e731db9665dd4311fbf24ea01097ef48f` | [First OIDC deployment — 38679168688](https://github.com/gowthammail4macair/project5/actions/runs/38679168688) | Validation, backend deployment and frontend verification passed; Hosting job **2** succeeded |
| `c90744870eb64a2d13b1fc375422c9adbb407074` | [Automatic Lambda-probe push — 38680045151](https://github.com/gowthammail4macair/project5/actions/runs/38680045151) | Validation, backend deployment and frontend verification passed; Hosting job **3** succeeded |

The second deployment is triggered by an ordinary `git push origin main`, testing the routine push path rather than only manual workflow dispatch.

## Application verification

Both GitHub deployments passed TypeScript, **40 tests**, reference synthesis and frontend packaging. The **18 live integration checks passed twice**, including after the automatic log-probe push; the latest run is recorded in [live-smoke.json](../evidence/live-smoke.json):

- Cognito SRP login for two customers and two Agents.
- Missing/malformed token rejection, customer/Agent route permissions, cross-owner read/update/delete denial and correct personal/Agent queues.
- REST and generated/custom GraphQL operations against the same existing Ticket table, including create/read/update/delete, summary and close.
- Persisted REST/GraphQL comments with verified authors and denied cross-owner access.
- Allowed/disallowed CORS origins.
- WebSocket authentication, owner/Agent reads, cross-owner denial, and notifications from B's active stream consumer for REST/GraphQL writes and comments.

Each suite run cleaned up its four temporary users, six tickets and three sockets; customer credentials were never committed. The saved demo account remains available.

Real browser QA on the C HTTPS website also verified demo sign-in, the disabled customer Agent queue, live connection, REST ticket creation/status updates, a persisted comment/live notification, and GraphQL reads. The dedicated browser fixture `273a4902-2e21-4872-bb3f-df8b1cbf2a02` was deleted and a subsequent read returned 404; pre-existing tickets and the demo account are preserved. Browser results are recorded in [project5-browser-qa.json](../evidence/project5-browser-qa.json). Screenshots are local: `output/playwright/project5-browser-qa.jpg` and `output/playwright/project5-browser-final.jpg` in the workspace root. After Hosting job 3, the final frontend was reloaded, demo sign-in/live updates and the corrected source link were verified again, and the demo session was signed out.

The live ownership audit is [project5-ownership-qa.json](../evidence/project5-ownership-qa.json). It verifies native pool/table owners in B's original nested stacks, unchanged physical table IDs and key/stream configuration, retained Cognito identity/configuration, both table protections enabled, no native shared-state resources in C, both deployed provider-role management-deny policies, and exactly one active stream consumer (B).

## Repeat a normal application deployment

From the Project5 checkout:

```bash
cd /Users/testadmin/Documents/AmplifyGen1_to_Gen2_migration/project5-migration/project5-generation
source ../private-evidence/project5-step9-inputs.sh
export GEN2_APP_ID=d3bsim6mrnq854
export GEN2_BRANCH=main
export PROJECT5_ALLOWED_ORIGINS='["http://localhost:3000","https://main.d3bsim6mrnq854.amplifyapp.com"]'
npm ci
npm run validate

git status --short
git diff
# Stage only the paths you reviewed; substitute the actual filenames.
git add -- PATHS_YOU_REVIEWED
git diff --cached --check
git commit -m "Describe your application change"
git push origin main

gh run list --repo gowthammail4macair/project5 --limit 3
```

Open the new run and wait for both jobs and the Hosting verification to pass. Routine deployments no longer require a Mac `pipeline-deploy` command. Do not run a second independent backend or Hosting deployment simultaneously. For live integration QA with your authorized local AWS session:

```bash
node scripts/project5-smoke-test.cjs
```

To locate the test marker in AWS Console: **Mumbai → CloudWatch → Logs → Log groups → `/aws/lambda/amplify-d3bsim6mrnq854-ma-project5ticketRestlambda-FrGS4e5cAphU` → Search all log streams**. Filter for `PROJECT5_CICD_PROBE_20261015`.

CLI equivalent:

```bash
aws logs filter-log-events \
  --region ap-south-1 \
  --log-group-name /aws/lambda/amplify-d3bsim6mrnq854-ma-project5ticketRestlambda-FrGS4e5cAphU \
  --filter-pattern '"PROJECT5_CICD_PROBE_20261015"' \
  --query 'events[].{timestamp:timestamp,message:message}'
```

The marker is in `amplify/function/ticketRest/handler.js`. To remove it later, restore that file's one-line re-export, validate, commit and push; the same pipeline deploys the removal.

Before the later managed-placeholder/ownership-refactor steps, set `PROJECT5_DEPLOY_ENABLED=false` and wait for active jobs to finish. This pipeline and its provider guards are specifically reviewed for reference QA; the ownership-transfer phase still needs its own template/workflow review.

## Final probe evidence

The automatic run [38680045151](https://github.com/gowthammail4macair/project5/actions/runs/38680045151) completed successfully for **`c90744870eb64a2d13b1fc375422c9adbb407074`**, and Hosting job **3** published that exact commit. The public `build.json` matched it and retained B's Cognito pool/client IDs. Full selected run/job/manifest evidence: [project5-cicd.json](../evidence/project5-cicd.json).

The REST Lambda's code SHA-256 changed from `xyivoNcrVAizdOEesksBCJp+BGmrG5dO5mfKcQhEroI=` to `RfPuTtbgadk8ZzbjACzERfHrSHB6lVXdhu8Azd/ZrrE=`. AWS reports the new version successfully updated at **2026-10-15 04:13:22 UTC** (**09:43:22 IST**).

CloudWatch captured the marker during an authenticated `GET /tickets/{id}` at **04:15:22.471 UTC** (**09:45:22.471 IST**), request ID **`b8a79e4d-0aa5-4358-b548-dbe2ee6531a1`**. The selected safe messages and code hashes are in [project5-lambda-probe.json](../evidence/project5-lambda-probe.json). This verifies actual execution of the pushed code, in addition to a green deployment job.

Final documentation/evidence are committed separately with `[skip ci]` because that commit changes only records and does not require another identical application deployment. The deployed application revision remains `c907448`; do not use that skip marker for application, infrastructure, workflow or dependency changes.
