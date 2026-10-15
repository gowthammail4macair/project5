# B / pftest SupportDesk frontend

This branch serves B only. `backend.json` records B's public resource IDs and
`hosting.json` records its separate S3/CloudFront website. The original A site
is preserved. Builds require current `amplify_outputs.json`; they cannot fall
back to copied deployment evidence.

Follow [the B release guide](../docs/B-FRONTEND.md). CI validates this branch;
it does not deploy a backend or publish a frontend automatically.
