const assert = require('node:assert/strict');
const deployment = require('../deployment.json');
const expected = require('../frontend/backend.json');

function checkBackendOutputs(outputs) {
  assert.equal(deployment.envName, 'pftest', 'This checkout serves B only');
  assert.equal(outputs.auth?.aws_region, deployment.region, 'Wrong auth Region');
  assert.equal(outputs.auth?.user_pool_id, expected.userPoolId, 'Expected B Cognito pool');
  assert.equal(outputs.auth?.user_pool_client_id, expected.userPoolClientId, 'Expected B web client');
  assert.equal(outputs.data?.url, expected.graphqlEndpoint, 'Expected B GraphQL API');
  assert.equal(outputs.data?.aws_region, deployment.region, 'Wrong GraphQL Region');
  assert.equal(outputs.custom?.rest?.endpoint.replace(/\/$/, ''),
    `https://${expected.restApiId}.execute-api.${deployment.region}.amazonaws.com/${deployment.envName}`, 'Expected B REST API');
  assert.equal(outputs.custom?.websocket?.endpoint,
    `wss://${expected.websocketApiId}.execute-api.${deployment.region}.amazonaws.com/${deployment.envName}`, 'Expected B WebSocket API');
  assert.equal(outputs.custom?.ticketTableName, expected.ticketTableName, 'Expected B Ticket table');
  assert.equal(outputs.custom?.connectionsTableName, expected.connectionsTableName, 'Expected B Connections table');
  assert.deepEqual(outputs.custom?.backendEnvironment,
    { appId: deployment.appId, envName: deployment.envName, stackName: expected.stackName }, 'Export current B outputs first');
}

module.exports = { checkBackendOutputs };
