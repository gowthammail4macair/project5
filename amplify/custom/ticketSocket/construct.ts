import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnApi, CfnAuthorizer, CfnIntegration, CfnRoute, CfnStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { CfnPermission } from 'aws-cdk-lib/aws-lambda';
import { Table, type ITable } from 'aws-cdk-lib/aws-dynamodb';
import type { Backend } from '../../backend';
import { project5, qaReferences } from '../../project5';
const branchName = project5.branch;
export class TicketSocket extends Construct {
    readonly connections: ITable;
    readonly api: CfnApi;
    constructor(scope: Construct, id: string, backend: Backend) {
        super(scope, id);
        const handlerArn = backend.ticketSocketHandler.resources.lambda.functionArn;
        const authorizerArn = backend.ticketAuthorizer.resources.lambda.functionArn;
        this.connections = Table.fromTableArn(this, 'BConnections', qaReferences.connectionsTableArn);
        const api = this.api = new CfnApi(this, 'TicketSocket', { name: cdk.Fn.join('-', ['ticket-socket', branchName]),
            protocolType: 'WEBSOCKET', routeSelectionExpression: '$request.body.action' });
        const uri = (arn: string) => cdk.Fn.join('', ['arn:', cdk.Aws.PARTITION, ':apigateway:', cdk.Aws.REGION, ':lambda:path/2015-03-31/functions/', arn, '/invocations']);
        const integration = new CfnIntegration(this, 'LambdaIntegration', { apiId: api.ref, integrationType: 'AWS_PROXY', integrationMethod: 'POST', integrationUri: uri(handlerArn) });
        const authorizer = new CfnAuthorizer(this, 'CognitoTokenVerifier', { apiId: api.ref, authorizerType: 'REQUEST', name: 'CognitoTokenVerifier',
            authorizerUri: uri(authorizerArn), identitySource: ['route.request.querystring.token'] });
        for (const routeKey of ['$connect', '$disconnect', '$default', 'getTicket']) {
            new CfnRoute(this, routeKey.replace('$', '') + 'Route', { apiId: api.ref, routeKey,
                target: cdk.Fn.join('/', ['integrations', integration.ref]), authorizationType: routeKey === '$connect' ? 'CUSTOM' : 'NONE',
                ...(routeKey === '$connect' ? { authorizerId: authorizer.ref } : {}) });
        }
        new CfnStage(this, 'Stage', { apiId: api.ref, stageName: branchName, autoDeploy: true });
        new CfnPermission(this, 'InvokeHandler', { action: 'lambda:InvokeFunction', functionName: handlerArn, principal: 'apigateway.amazonaws.com',
            sourceArn: cdk.Fn.join('', ['arn:', cdk.Aws.PARTITION, ':execute-api:', cdk.Aws.REGION, ':', cdk.Aws.ACCOUNT_ID, ':', api.ref, '/*/*']) });
        new CfnPermission(this, 'InvokeAuthorizer', { action: 'lambda:InvokeFunction', functionName: authorizerArn, principal: 'apigateway.amazonaws.com',
            sourceArn: cdk.Fn.join('', ['arn:', cdk.Aws.PARTITION, ':execute-api:', cdk.Aws.REGION, ':', cdk.Aws.ACCOUNT_ID, ':', api.ref, '/authorizers/*']) });
        new cdk.CfnOutput(this, 'WebSocketUrl', { value: cdk.Fn.join('', ['wss://', api.ref, '.execute-api.', cdk.Aws.REGION, '.', cdk.Aws.URL_SUFFIX, '/', branchName]) });
        new cdk.CfnOutput(this, 'WebSocketApiId', { value: api.ref });
    }
}
