const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkConfig, checkTarget } = require('../scripts/project5-deploy-check.cjs');

test('deployment accepts C on main and rejects wrong identity or concurrent Hosting builds', () => {
  const env = {
    GITHUB_REF: 'refs/heads/main', GEN2_BRANCH: 'main', AWS_REGION: 'ap-south-1',
    GEN2_APP_ID: 'dexamplec123',
    PROJECT5_DEPLOY_ROLE_ARN: 'arn:aws:iam::112097210422:role/Project5GitHubDeploy',
  };
  const identity = { Account: '112097210422' };
  const app = {
    appArn: 'arn:aws:amplify:ap-south-1:112097210422:apps/dexamplec123',
    repository: 'https://github.com/gowthammail4macair/project5.git',
  };
  const branch = { branchName: 'main', enableAutoBuild: false };
  assert.doesNotThrow(() => checkTarget(env, identity, app, branch));
  for (const change of [
    { GEN2_APP_ID: '' }, { GEN2_APP_ID: 'dprojectfivepreview' },
    { GEN2_APP_ID: 'd1zija7gqlw461' }, { AWS_REGION: 'us-east-1' },
    { GITHUB_REF: 'refs/heads/review' }, { GEN2_BRANCH: 'review' },
    { PROJECT5_DEPLOY_ROLE_ARN: 'arn:aws:iam::999999999999:role/deploy' },
  ]) assert.throws(() => checkConfig({ ...env, ...change }));
  assert.throws(() => checkTarget(env, { Account: '999999999999' }, app, branch));
  assert.throws(() => checkTarget(env, identity, { ...app, appArn: app.appArn + '-other' }, branch));
  assert.throws(() => checkTarget(env, identity, { ...app, repository: 'https://github.com/gowthammail4macair/project3' }, branch));
  assert.throws(() => checkTarget(env, identity, app, { ...branch, branchName: 'review' }));
  assert.throws(() => checkTarget(env, identity, app, { ...branch, enableAutoBuild: true }));
});
