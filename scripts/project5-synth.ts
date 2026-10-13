import assert from 'node:assert/strict';
import { readdirSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { App } from 'aws-cdk-lib';

async function main() {
  const mode = process.argv[2];
  assert.ok(mode === 'reference' || mode === 'managed', 'Mode: reference or managed');
  const appId = process.env.GEN2_APP_ID ?? 'dprojectfivepreview';
  const branch = process.env.GEN2_BRANCH ?? 'main';
  const originalPool = process.env.TEST_USER_POOL_ID ?? 'ap-south-1_zgT2JWoBE';
  assert.ok(appId && /^d[a-z0-9]+$/.test(appId), 'Set GEN2_APP_ID');
  assert.ok(branch, 'Set GEN2_BRANCH');
  assert.ok(originalPool, 'Set TEST_USER_POOL_ID to B');
  const referenceIds: Record<string, string | undefined> = {
    userPoolId: originalPool,
    userPoolClientId: process.env.TEST_WEB_CLIENT_ID ?? '6ugasqqj1n74lb521orpj047pd',
    identityPoolId: process.env.TEST_IDENTITY_POOL_ID,
    authRoleArn: process.env.TEST_AUTH_ROLE_ARN,
    unauthRoleArn: process.env.TEST_UNAUTH_ROLE_ARN,
  };
  if (mode === 'reference') for (const [key, value] of Object.entries(referenceIds)) assert.ok(value, 'Set B reference: ' + key);
  const expectedTables = JSON.parse(process.env.EXPECTED_MODEL_TABLE_NAMES ?? '[\"Ticket-yfs4rx4ynvgulalyky2k3zfrxi-pftest\"]');
  assert.ok(Array.isArray(expectedTables) && expectedTables.every(x => typeof x === 'string' && x.length > 0));
  assert.equal(new Set(expectedTables).size, expectedTables.length, 'Expected model table names must be unique');
  const expectedClients = Number(process.env.EXPECTED_MANAGED_CLIENT_COUNT ?? '2');
  assert.ok(Number.isInteger(expectedClients) && expectedClients > 0, 'Set actual B client count');

  process.env.AWS_BRANCH = branch;
  process.env.CDK_OUTDIR = 'dist/project5-' + mode + '.out';
  // Remove only this helper's generated assembly so stale templates cannot pass/fail a later check.
  rmSync(process.env.CDK_OUTDIR, { recursive: true, force: true });
  process.env.CDK_CONTEXT_JSON = JSON.stringify({
    'amplify-backend-namespace': appId,
    'amplify-backend-name': branch,
    'amplify-backend-type': 'branch',
    '@aws-cdk/core:validateAgainstDefaultRules': true,
  });
  const { backend } = await import('../amplify/backend');
  const assembly = (backend.stack.node.root as App).synth();
  const files = readdirSync(assembly.directory, { recursive: true }) as string[];
  type ResourceRow = { file: string; logicalId: string; Type: string; Properties?: Record<string, any> };
  const rows = files.filter(f => f.endsWith('.template.json')).flatMap(file => {
    const template = JSON.parse(readFileSync(path.join(assembly.directory, file), 'utf8'));
    return Object.entries(template.Resources || {}).map(([logicalId, resource]) => ({
      file, logicalId, ...(resource as Record<string, any>),
    }));
  }) as ResourceRow[];
  const ofType = (type: string) => rows.filter(r => r.Type === type);
  const importedTables = ofType('Custom::ImportedAmplifyDynamoDBTable');
  assert.deepEqual(importedTables.map(r => r.Properties?.tableName).sort(), [...expectedTables].sort(),
    'Model mapping must select B tables for the actual destination branch');
  assert.equal(ofType('Custom::AmplifyDynamoDBTable').length, 0,
    'Unexpected fresh model-table path; inspect branch mappings');

  if (mode === 'reference') {
    for (const type of [
      'AWS::Cognito::UserPool', 'AWS::Cognito::UserPoolClient',
      'AWS::Cognito::IdentityPool', 'AWS::Cognito::IdentityPoolRoleAttachment',
      'AWS::Cognito::UserPoolGroup', 'AWS::Cognito::UserPoolDomain',
      'AWS::Cognito::UserPoolIdentityProvider', 'AWS::DynamoDB::Table',
    ]) assert.equal(ofType(type).length, 0, 'Reference QA still declares managed state: ' + type);
    assert.equal(ofType('Custom::AmplifyRefAuth').length, 1);
    for (const [key, value] of Object.entries(referenceIds)) {
      assert.equal(ofType('Custom::AmplifyRefAuth')[0].Properties?.[key], value, 'Wrong B auth reference: ' + key);
    }
  } else {
    assert.equal(ofType('Custom::AmplifyRefAuth').length, 0);
    assert.equal(ofType('AWS::Cognito::UserPool').length, 1);
    assert.equal(ofType('AWS::Cognito::UserPoolClient').length, expectedClients);
    assert.equal(ofType('AWS::Cognito::IdentityPool').length, 1);
  }
  const methods = ofType('AWS::ApiGateway::Method');
  assert.equal(methods.filter(r => r.Properties?.AuthorizationType === 'COGNITO_USER_POOLS').length, 7);
  assert.equal(methods.filter(r => r.Properties?.AuthorizationType === 'CUSTOM').length, 1);
  assert.equal(methods.filter(r => r.Properties?.HttpMethod === 'OPTIONS' && r.Properties?.AuthorizationType === 'NONE').length, 4);
  assert.ok(!methods.some(r => r.Properties?.HttpMethod === 'ANY'));
  assert.ok(!methods.some(r => r.Properties?.HttpMethod !== 'OPTIONS' && r.Properties?.AuthorizationType === 'NONE'));
  const routes = ofType('AWS::ApiGatewayV2::Route');
  assert.deepEqual(routes.map(r => r.Properties?.RouteKey).sort(), ['$connect','$default','$disconnect','getTicket'].sort());
  assert.equal(routes.find(r => r.Properties?.RouteKey === '$connect')?.Properties?.AuthorizationType, 'CUSTOM');
  const mappings = ofType('AWS::Lambda::EventSourceMapping');
  assert.equal(mappings.length,1);
  assert.equal(mappings[0].Properties?.Enabled,false,'Avoid a second broadcaster before QA consumer handoff');
  const resolvers = ofType('AWS::AppSync::Resolver');
  for (const field of ['createTicket','getTicket','listTickets','updateTicket','deleteTicket','ticketSummary','closeTicket','listTicketComments','addTicketComment']) {
    assert.ok(resolvers.some(r => r.Properties?.FieldName === field), field);
  }
  const serialized = JSON.stringify(rows);
  for (const action of ['cognito-idp:ListUsersInGroup','dynamodb:GetRecords','execute-api:ManageConnections']) assert.ok(serialized.includes(action),action);
  assert.ok(!serialized.includes('GetAtt:TicketTable:StreamArn'),'Gen1 export must not be used for the Gen2 stream');
  const pipeline = resolvers.find(r => r.Properties?.FieldName === 'createTicket')!;
  assert.ok(JSON.stringify(pipeline.Properties?.RequestMappingTemplate).includes('$ctx.args.input.put'));
  for (const table of importedTables) {
    assert.equal(table.Properties?.deletionProtectionEnabled,true);
    assert.equal(table.Properties?.allowDestructiveGraphqlSchemaUpdates,false);
    assert.equal(table.Properties?.sseSpecification.sseEnabled,true);
  }
  if (mode === 'managed') {
    assert.equal(ofType('AWS::DynamoDB::Table').length,1,'Only the Connections placeholder table is managed');
    assert.equal(ofType('AWS::Cognito::UserPoolGroup').length,1);
    for (const r of [...ofType('AWS::Cognito::UserPool'),...ofType('AWS::Cognito::UserPoolClient'),...ofType('AWS::Cognito::IdentityPool'),...ofType('AWS::Cognito::UserPoolGroup'),...ofType('AWS::DynamoDB::Table')]) {
      assert.equal((r as any).DeletionPolicy,'Retain',r.Type);
      assert.equal((r as any).UpdateReplacePolicy,'Retain',r.Type);
    }
  }
  const summary = {
    status: 'passed', scope: 'Local structure/selected-identity checks; no deployment',
    mode, appId, branch, directory: assembly.directory,
    modelTables: importedTables.map(r => r.Properties?.tableName),
    userPools: ofType('AWS::Cognito::UserPool').length,
    userPoolClients: ofType('AWS::Cognito::UserPoolClient').length,
    nativeS3BucketsForReview: ofType('AWS::S3::Bucket').map(r => ({
      file: r.file, logicalId: r.logicalId,
    })),
  };
  mkdirSync('evidence', { recursive: true });
  writeFileSync('evidence/synthesis.json', JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
