// Hosting only retrieves outputs; the preceding GitHub step deploys the backend.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { checkConfig } = require('./project5-deploy-check.cjs');
const env = process.env;
const aws = (...args) => JSON.parse(execFileSync('aws', [...args,
  '--region', env.AWS_REGION, '--output', 'json'], { encoding: 'utf8' }));

async function main() {
  checkConfig(env);
  assert.match(env.GITHUB_SHA || '', /^[a-f0-9]{40}$/);
  const job = aws('amplify', 'start-job', '--app-id', env.GEN2_APP_ID,
    '--branch-name', 'main', '--job-type', 'RELEASE', '--commit-id', env.GITHUB_SHA,
    '--job-reason', `GitHub Actions ${env.GITHUB_RUN_ID}`).jobSummary;
  console.log(`Amplify Hosting job ${job.jobId} started for ${env.GITHUB_SHA}`);
  const deadline = Date.now() + 25 * 60 * 1000;
  while (Date.now() < deadline) {
    const current = aws('amplify', 'get-job', '--app-id', env.GEN2_APP_ID,
      '--branch-name', 'main', '--job-id', job.jobId).job.summary;
    console.log(`Hosting job ${job.jobId}: ${current.status}`);
    if (['FAILED', 'CANCELLED'].includes(current.status)) throw new Error(`Hosting ${current.status}`);
    if (current.status === 'SUCCEED') {
      assert.equal(current.commitId, env.GITHUB_SHA, 'Hosting published a different commit');
      const url = `https://main.${env.GEN2_APP_ID}.amplifyapp.com/build.json`;
      for (let retry = 0; retry < 12; retry++) {
        const response = await fetch(url + '?sha=' + env.GITHUB_SHA,
          { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (response.ok) {
          const build = await response.json();
          if (build.sourceSha === env.GITHUB_SHA) {
            assert.equal(build.auth.poolId, env.TEST_USER_POOL_ID);
            assert.equal(build.auth.clientId, env.TEST_WEB_CLIENT_ID);
            console.log(`Verified frontend commit and B auth: ${url}`);
            return;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      throw new Error('Published frontend manifest does not match this GitHub commit');
    }
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  throw new Error(`Hosting job ${job.jobId} exceeded the observation deadline; inspect it before retrying`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
