# Project5

Gen2 migration of the isolated Gen1 `pftest` environment. The current code is the Step 9 reference-QA configuration: it uses B's existing Cognito resources, Ticket table and Connections table. The managed Step 8 baseline is preserved on the local `project5-managed-baseline` branch for later reviewed ownership planning.

Load the required reference variables before running `npm run validate`. It checks TypeScript, application tests and reference-mode backend synthesis. Synthesis uses `main` and a local preview app ID until `GEN2_APP_ID` is supplied. Deployment and ownership refactoring are separate subsequent checkpoints.

Notifications remain disabled until the reviewed single-consumer handoff and callback permissions for both WebSocket endpoints are ready. The imported Ticket-model provider is guarded against shared-table management writes during QA; it is not a passive table handle.

See [Step 8 repairs](docs/STEP8-REPAIRS.md) and the preserved [migration notes](migration_steps_notes.md). Gen1 CLI operations belong in the intact control checkout.

For backend CI, follow [GitHub Actions deployment setup](docs/GITHUB-ACTIONS-DEPLOYMENT.md). The workflow validates pushes to `main`; AWS deployment is enabled only when the repository variable `PROJECT5_DEPLOY_ENABLED` is `true` and the OIDC role/actual C app settings are configured.
