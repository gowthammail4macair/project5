const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { checkBackendOutputs } = require('../scripts/check-backend-outputs.cjs');
const cfg = require('../deployment.json'), expected = require('../frontend/backend.json');

function outputs() {
  return { auth: { aws_region: cfg.region, user_pool_id: expected.userPoolId, user_pool_client_id: expected.userPoolClientId },
    data: { url: expected.graphqlEndpoint, aws_region: cfg.region }, custom: {
      rest: { endpoint: `https://${expected.restApiId}.execute-api.${cfg.region}.amazonaws.com/${cfg.envName}` },
      websocket: { endpoint: `wss://${expected.websocketApiId}.execute-api.${cfg.region}.amazonaws.com/${cfg.envName}` },
      ticketTableName: expected.ticketTableName, connectionsTableName: expected.connectionsTableName,
      backendEnvironment: { appId: cfg.appId, envName: cfg.envName, stackName: expected.stackName }
    } };
}

test('B rejects copied A or mixed-environment outputs before building', () => {
  checkBackendOutputs(outputs());
  for (const [keys, value] of [
    [['auth', 'user_pool_id'], 'ap-south-1_5Q6nrDXqS'],
    [['auth', 'user_pool_client_id'], '5q329vugqps0dl8lcil9gs504e'],
    [['auth', 'aws_region'], 'us-east-1'],
    [['data', 'url'], 'https://example.invalid/graphql'],
    [['custom', 'rest', 'endpoint'], 'https://example.invalid/main'],
    [['custom', 'websocket', 'endpoint'], 'wss://example.invalid/main'],
    [['custom', 'ticketTableName'], 'Ticket-original-dev'],
    [['custom', 'connectionsTableName'], 'Connections-original'],
    [['custom', 'backendEnvironment', 'envName'], 'dev'],
    [['custom', 'backendEnvironment'], undefined]
  ]) {
    const candidate = outputs(); let target = candidate;
    for (const key of keys.slice(0, -1)) target = target[key];
    target[keys.at(-1)] = value;
    assert.throws(() => checkBackendOutputs(candidate), undefined, keys.join('.'));
  }
});

test('Real frontend packaging embeds B auth/APIs and refuses stale A evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b-frontend-'));
  try {
    for (const file of ['deployment.json', 'package.json', 'frontend', 'scripts']) {
      fs.cpSync(file, path.join(dir, file), { recursive: true, filter: source => !source.includes('/dist') });
    }
    fs.symlinkSync(path.resolve('node_modules'), path.join(dir, 'node_modules'), 'dir');
    const run = () => spawnSync(process.execPath, ['scripts/build-frontend.cjs'], { cwd: dir, encoding: 'utf8', env: { ...process.env, GITHUB_SHA: 'a'.repeat(40) } });
    fs.mkdirSync(path.join(dir, 'evidence'));
    fs.writeFileSync(path.join(dir, 'evidence/deployed-outputs.json'), JSON.stringify(outputs()));
    assert.notEqual(run().status, 0, 'No fallback to old evidence');
    fs.writeFileSync(path.join(dir, 'amplify_outputs.json'), JSON.stringify(outputs()));
    const built = run(); assert.equal(built.status, 0, built.stderr);
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'frontend/dist/build.json')));
    assert.equal(manifest.environment, 'pftest');
    assert.equal(manifest.auth.poolId, expected.userPoolId);
    assert.equal(manifest.api.graphql, expected.graphqlEndpoint);
    const bundle = fs.readFileSync(path.join(dir, 'frontend/dist', manifest.assets[0].path), 'utf8');
    for (const value of [expected.userPoolId, expected.userPoolClientId, expected.graphqlEndpoint, expected.restApiId, expected.websocketApiId]) assert.ok(bundle.includes(value));
    assert.ok(!bundle.includes('ap-south-1_5Q6nrDXqS'));
    const wrong = outputs(); wrong.auth.user_pool_id = 'ap-south-1_5Q6nrDXqS';
    fs.writeFileSync(path.join(dir, 'amplify_outputs.json'), JSON.stringify(wrong));
    assert.notEqual(run().status, 0, 'Copied A config must fail packaging');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
