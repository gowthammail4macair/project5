# Project5

Gen2 migration of the isolated Gen1 `pftest` environment. The current code is the Step 9 reference-QA configuration: it uses B's existing Cognito resources, Ticket table and Connections table. The managed Step 8 baseline is preserved on the local `project5-managed-baseline` branch for later reviewed ownership planning.

Load the required reference variables before running `npm run validate`. It checks TypeScript, application tests and reference-mode backend synthesis. Synthesis uses `main` and a local preview app ID until `GEN2_APP_ID` is supplied. Deployment and ownership refactoring are separate subsequent checkpoints.

C's stream consumer remains disabled during reference QA. B's active consumer has callback permission for both endpoints and sends notifications to C clients. The imported Ticket-model provider is guarded against shared-table management writes during QA; it is not a passive table handle.

See [Step 8 repairs](docs/STEP8-REPAIRS.md) and the preserved [migration notes](migration_steps_notes.md). Gen1 CLI operations belong in the intact control checkout.

For CI/CD, follow [GitHub Actions deployment setup](docs/GITHUB-ACTIONS-DEPLOYMENT.md). Pushes to `main` validate, deploy the backend, then publish the frontend when `PROJECT5_DEPLOY_ENABLED=true`. C is `d3bsim6mrnq854/main`; its website is https://main.d3bsim6mrnq854.amplifyapp.com. Hosting Auto-build stays off because the GitHub workflow starts the Hosting job after backend success.

The [verified CI/CD results](docs/CICD-VERIFICATION.md) record the automatic push deployment, Lambda log proof, application tests and preserved resource ownership.
