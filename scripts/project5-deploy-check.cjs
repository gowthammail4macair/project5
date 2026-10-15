const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const account = '112097210422';
const region = 'ap-south-1';

function checkConfig(env) {
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Deploy only from GitHub main');
  assert.equal(env.GEN2_BRANCH, 'main', 'C branch must be main');
  assert.equal(env.AWS_REGION, region, 'C must use the B reference Region');
  assert.match(env.GEN2_APP_ID || '', /^d[a-z0-9]+$/, 'Set the actual C GEN2_APP_ID');
  assert.notEqual(env.GEN2_APP_ID, 'dprojectfivepreview', 'Preview ID cannot be deployed');
  assert.notEqual(env.GEN2_APP_ID, 'd1zija7gqlw461', 'Do not deploy into the Gen1 app');
  assert.match(env.PROJECT5_DEPLOY_ROLE_ARN || '',
    /^arn:aws:iam::112097210422:role\/[\w+=,.@/-]+$/,
    'Set PROJECT5_DEPLOY_ROLE_ARN to the GitHub deployment role');
}

function checkTarget(env, identity, app, branch) {
  checkConfig(env);
  assert.equal(identity.Account, account, 'Wrong AWS account');
  assert.equal(app.appArn, `arn:aws:amplify:${region}:${account}:apps/${env.GEN2_APP_ID}`,
    'Wrong Amplify app/account/Region');
  const repository = (app.repository || '').replace(/\/$/, '').replace(/\.git$/, '').toLowerCase();
  assert.equal(repository, 'https://github.com/gowthammail4macair/project5',
    'C must be connected to the Project5 repository');
  assert.equal(branch.branchName, 'main', 'Wrong Amplify branch');
  assert.equal(branch.enableAutoBuild, false, 'Disable main Auto-build in Amplify first');
}

if (require.main === module) {
  checkConfig(process.env);
  const mode = process.argv[2];
  assert.ok(mode === 'config' || mode === 'live', 'Use config or live');
  if (mode === 'live') {
    const aws = (...args) => JSON.parse(execFileSync('aws',
      [...args, '--region', region, '--output', 'json'], { encoding: 'utf8' }));
    checkTarget(process.env,
      aws('sts', 'get-caller-identity'),
      aws('amplify', 'get-app', '--app-id', process.env.GEN2_APP_ID).app,
      aws('amplify', 'get-branch', '--app-id', process.env.GEN2_APP_ID, '--branch-name', 'main').branch);
  }
  console.log(`Project5 ${mode} deployment checks passed`);
}

module.exports = { checkConfig, checkTarget };
