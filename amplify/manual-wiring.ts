import { Duration, Stack } from 'aws-cdk-lib';
import { EventSourceMapping, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import type { Backend } from './backend';
import type { TicketSocket } from './custom/ticketSocket/construct';
import { project5, qaReferences, qaAllowedOrigins } from './project5';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
export function wireBackend(backend: Backend, socket: TicketSocket) {
  const tickets = backend.data.resources.tables['Ticket'];
  for (const fn of [backend.ticketRest, backend.ticketWorkflow]) {
    tickets.grantReadWriteData(fn.resources.lambda);
    fn.addEnvironment('TICKET_TABLE', tickets.tableName);
  }
  tickets.grantReadData(backend.ticketSocketHandler.resources.lambda);
  backend.ticketSocketHandler.addEnvironment('TICKET_TABLE', tickets.tableName);
  socket.connections.grantReadWriteData(backend.ticketSocketHandler.resources.lambda);
  backend.ticketSocketHandler.addEnvironment('CONNECTIONS_TABLE', socket.connections.tableName);
  const streamTable = Table.fromTableAttributes(Stack.of(backend.ticketSocketHandler.resources.lambda), 'BTicketStream', {
    tableArn: tickets.tableArn, tableStreamArn: qaReferences.ticketStreamArn,
  });
  const streamGrant = streamTable.grantStreamRead(backend.ticketSocketHandler.resources.lambda);
  const mapping = new EventSourceMapping(Stack.of(backend.ticketSocketHandler.resources.lambda), 'TicketNotifications', {
    target: backend.ticketSocketHandler.resources.lambda, eventSourceArn: streamTable.tableStreamArn,
    enabled: project5.notificationsReady, startingPosition: StartingPosition.LATEST,
    batchSize: 10, bisectBatchOnError: true, retryAttempts: 3, maxRecordAge: Duration.hours(1),
  });
  streamGrant.applyBefore(mapping);
  backend.ticketAuthorizer.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);
  backend.ticketAuthorizer.addEnvironment('USER_POOL_CLIENT_ID', backend.auth.resources.userPoolClient.userPoolClientId);
  backend.ticketRest.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);
  backend.ticketRest.resources.lambda.addToRolePolicy(new PolicyStatement({
    actions: ['cognito-idp:ListUsersInGroup'], resources: [backend.auth.resources.userPool.userPoolArn],
  }));
  backend.ticketRest.addEnvironment('ALLOWED_ORIGINS', JSON.stringify(qaAllowedOrigins));
  backend.ticketSocketHandler.resources.lambda.addToRolePolicy(new PolicyStatement({
    actions: ['execute-api:ManageConnections'], resources: [
      Stack.of(socket).formatArn({ service: 'execute-api', resource: socket.api.ref,
        resourceName: project5.branch + '/*/@connections/*' }),
      Stack.of(socket).formatArn({ service: 'execute-api', resource: qaReferences.sourceWebsocketApiId,
        resourceName: qaReferences.sourceWebsocketStage + '/*/@connections/*' }),
    ],
  }));
  backend.addOutput({ custom: {
    websocket: { endpoint: 'wss://' + socket.api.ref + '.execute-api.' + Stack.of(socket).region + '.' + Stack.of(socket).urlSuffix + '/' + project5.branch },
    ticketTableName: tickets.tableName, connectionsTableName: socket.connections.tableName,
  }});
}
