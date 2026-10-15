# Project5 SupportDesk frontend

Website: https://main.d3bsim6mrnq854.amplifyapp.com

C's frontend uses B's existing Cognito pool and shared Ticket/Connections tables through C's REST, GraphQL and WebSocket APIs. B retains native state ownership during this QA phase and remains the active stream broadcaster; C's stream mapping stays disabled.

## Deploy through GitHub Actions

Push reviewed changes to `main`. The workflow validates, deploys C's backend, then explicitly releases the frontend through Amplify Hosting. Hosting fetches C's `amplify_outputs.json`, builds `frontend/dist`, and publishes it. The workflow checks the published commit and B auth IDs in `build.json`. Amplify Auto-build stays disabled.

Follow [CI/CD setup](../docs/GITHUB-ACTIONS-DEPLOYMENT.md) and [verified results](../docs/CICD-VERIFICATION.md). The old S3/CloudFront `hosting*.json` files are inherited Gen1 evidence; the current Project5 frontend uses the Amplify Hosting URL above.

## Run locally

From the Project5 repository root, using the authorized AWS CLI session in Mumbai:

```bash
cd /Users/testadmin/Documents/AmplifyGen1_to_Gen2_migration/project5-migration/project5-generation
export AWS_REGION=ap-south-1
npm ci
npx ampx generate outputs --app-id d3bsim6mrnq854 --branch main
npm run frontend:build
python3 -m http.server 3000 --directory frontend/dist
```

Open http://localhost:3000. Keep the server running; press Control-C to stop it. The backend already permits this origin. Sign in with an existing B Cognito account, including the saved demo customer account. Credentials and generated outputs stay outside Git.

For backend code validation, load the nine B reference inputs and C's actual app ID as described in the CI/CD guide before `npm run validate`.

## Application checks

The app supports personal tickets through REST/GraphQL, status changes, summaries/closing through custom GraphQL Lambda resolvers, comments, WebSocket notifications, and an Agents-only queue. The live suite checks allowed and denied access with temporary users and removes its own fixtures:

```bash
node scripts/project5-smoke-test.cjs
```

The 15 October checks passed all 18 live integration checks twice and verified real browser sign-in, creation, updates, comments and GraphQL reads. Current evidence is linked from the verification document. Older evidence copied from the Gen1 project describes earlier deployments.
