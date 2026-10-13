// Copy into Gen2 amplify/api/supportRest/resource.ts after generation.
// This defines the reviewed REST API shape; runtime IAM/env wiring is separate.
import { Duration, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  AuthorizationType, CognitoUserPoolsAuthorizer, LambdaIntegration,
  RestApi, TokenAuthorizer, ResponseType,
} from 'aws-cdk-lib/aws-apigateway';
import type { IUserPool } from 'aws-cdk-lib/aws-cognito';
import type { IFunction } from 'aws-cdk-lib/aws-lambda';

export function defineProject5RestApi(scope: Construct, id: string, props: {
  userPool: IUserPool;
  handler: IFunction;
  agentAuthorizer: IFunction;
  stageName: string;
}) {
  const api = new RestApi(scope, id, {
    restApiName: 'project5-support-tickets',
    deployOptions: { stageName: props.stageName },
  });
  const integration = new LambdaIntegration(props.handler);
  const cognito = new CognitoUserPoolsAuthorizer(scope, `${id}Cognito`, {
    cognitoUserPools: [props.userPool],
    identitySource: 'method.request.header.Authorization',
  });
  const agents = new TokenAuthorizer(scope, `${id}Agents`, {
    handler: props.agentAuthorizer,
    identitySource: 'method.request.header.Authorization',
    resultsCacheTtl: Duration.seconds(0),
  });
  const protectedOptions = { authorizationType: AuthorizationType.COGNITO, authorizer: cognito };
  const pathOptions = { ...protectedOptions, requestParameters: { 'method.request.path.id': true } };
  const tickets = api.root.addResource('tickets');
  for (const method of ['GET', 'POST']) tickets.addMethod(method, integration, protectedOptions);
  const ticket = tickets.addResource('{id}');
  for (const method of ['GET', 'PATCH', 'DELETE']) ticket.addMethod(method, integration, pathOptions);
  const comments = ticket.addResource('comments');
  for (const method of ['GET', 'POST']) comments.addMethod(method, integration, pathOptions);
  const admin = api.root.addResource('admin').addResource('tickets');
  admin.addMethod('GET', integration, { authorizationType: AuthorizationType.CUSTOM, authorizer: agents });
  for (const resource of [tickets, ticket, comments, admin]) {
    resource.addMethod('OPTIONS', integration, { authorizationType: AuthorizationType.NONE });
  }
  return api;
}

import type { Backend } from '../../backend';
import { project5 } from '../../project5';
export function defineSupportRestApi(backend: Backend) {
  const stack = Stack.of(backend.ticketRest.resources.lambda);
  const api = defineProject5RestApi(stack, 'Project5SupportRest', {
    userPool: backend.auth.resources.userPool,
    handler: backend.ticketRest.resources.lambda,
    agentAuthorizer: backend.ticketAuthorizer.resources.lambda,
    stageName: project5.branch,
  });
  for (const [name, type] of [['Cors4XX', ResponseType.DEFAULT_4XX], ['Cors5XX', ResponseType.DEFAULT_5XX]] as const) {
    api.addGatewayResponse(name, { type, responseHeaders: {
      'Access-Control-Allow-Origin': "'*'",
      'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
    }});
  }
  backend.addOutput({ custom: { rest: { endpoint: api.url, region: stack.region } } });
  return api;
}
