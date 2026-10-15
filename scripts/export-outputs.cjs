// Read deployed B resources without running a backend deployment.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const cfg = require('../deployment.json');
const expected = require('../frontend/backend.json');
const { checkBackendOutputs } = require('./check-backend-outputs.cjs');
const aws = (...args) => JSON.parse(execFileSync('aws', [...args, '--region', cfg.region, '--output', 'json'], { encoding: 'utf8' }));
const team = require('../amplify/team-provider-info.json')[cfg.envName].awscloudformation;
assert.equal(team.StackName, expected.stackName);
assert.equal(team.AmplifyAppId, cfg.appId);
assert.equal(aws('sts', 'get-caller-identity').Account, team.StackId.split(':')[4]);
const root = aws('cloudformation', 'describe-stacks', '--stack-name', team.StackName).Stacks[0];
assert.ok(['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(root.StackStatus));
const resources = aws('cloudformation', 'list-stack-resources', '--stack-name', team.StackName).StackResourceSummaries;
function stackOutputs(logicalId) {
  const resource = resources.find(r => r.LogicalResourceId === logicalId);
  assert.ok(resource, `Missing B stack ${logicalId}`);
  const stack = aws('cloudformation', 'describe-stacks', '--stack-name', resource.PhysicalResourceId).Stacks[0];
  assert.ok(['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(stack.StackStatus));
  return Object.fromEntries(stack.Outputs.map(o => [o.OutputKey, o.OutputValue]));
}
const auth = stackOutputs('authticketAuth'), graphql = stackOutputs('apisupportGraphql');
const rest = stackOutputs('apisupportRest'), socket = stackOutputs('customticketSocket');
assert.equal(graphql.GraphQLAPIIdOutput, expected.graphqlApiId);
const api = aws('appsync', 'get-graphql-api', '--api-id', graphql.GraphQLAPIIdOutput).graphqlApi;
assert.equal(api.authenticationType, 'AMAZON_COGNITO_USER_POOLS');
assert.equal(api.userPoolConfig.userPoolId, expected.userPoolId);
const sources = aws('appsync', 'list-data-sources', '--api-id', api.apiId).dataSources;
assert.deepEqual(sources.filter(s => s.type === 'AMAZON_DYNAMODB').map(s => s.dynamodbConfig.tableName), [expected.ticketTableName]);
assert.equal(sources.find(s => s.type === 'AWS_LAMBDA')?.lambdaConfig.lambdaFunctionArn.split(':').at(-1), `ticketWorkflow-${cfg.envName}`);
for (const name of ['ticketRest', 'ticketWorkflow', 'ticketSocketHandler', 'ticketAuthorizer']) {
  const vars = aws('lambda', 'get-function-configuration', '--function-name', `${name}-${cfg.envName}`).Environment.Variables;
  if (name !== 'ticketAuthorizer') assert.equal(vars.TICKET_TABLE, expected.ticketTableName, `${name} table`);
  if (['ticketRest', 'ticketAuthorizer'].includes(name)) assert.equal(vars.USER_POOL_ID, expected.userPoolId, `${name} pool`);
  if (name === 'ticketSocketHandler') assert.equal(vars.CONNECTIONS_TABLE, expected.connectionsTableName);
  if (name === 'ticketAuthorizer') assert.equal(vars.USER_POOL_CLIENT_ID, expected.userPoolClientId);
}
for (const tableName of [expected.ticketTableName, expected.connectionsTableName]) {
  assert.equal(aws('dynamodb', 'describe-table', '--table-name', tableName).Table.TableStatus, 'ACTIVE');
}
const outputs = {
  version: '1.4', auth: { aws_region: cfg.region, user_pool_id: auth.UserPoolId, user_pool_client_id: auth.AppClientIDWeb },
  data: { url: graphql.GraphQLAPIEndpointOutput, aws_region: cfg.region },
  custom: { rest: { endpoint: rest.RootUrl, region: cfg.region }, websocket: { endpoint: socket.WebSocketUrl },
    ticketTableName: expected.ticketTableName, connectionsTableName: expected.connectionsTableName,
    backendEnvironment: { appId: cfg.appId, envName: cfg.envName, stackName: team.StackName } }
};
checkBackendOutputs(outputs);
fs.writeFileSync('amplify_outputs.json', JSON.stringify(outputs, null, 2) + '\n');
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/backend-wiring.json', JSON.stringify({ status: 'passed', verifiedAt: new Date().toISOString(),
  backend: outputs.custom.backendEnvironment, auth: outputs.auth, graphqlApiId: api.apiId, graphqlEndpoint: api.uris.GRAPHQL,
  dataSources: sources.map(s => ({ name: s.name, type: s.type, table: s.dynamodbConfig?.tableName, lambda: s.lambdaConfig?.lambdaFunctionArn })),
  checkedLambdaFunctions: ['ticketRest-pftest', 'ticketWorkflow-pftest', 'ticketSocketHandler-pftest', 'ticketAuthorizer-pftest'],
  tables: [expected.ticketTableName, expected.connectionsTableName]
}, null, 2) + '\n');
console.log('Verified B Cognito, APIs, Lambda configuration and tables; exported amplify_outputs.json');
