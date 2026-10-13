import { defineData } from '@aws-amplify/backend';
import type { Backend } from '../backend';
import { ticketWorkflow } from '../function/ticketWorkflow/resource';
import { project5 } from '../project5';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MappingTemplate } from 'aws-cdk-lib/aws-appsync';

const schema = `enum TicketStatus { OPEN IN_PROGRESS CLOSED }
type Ticket @model @auth(rules: [
  {allow: owner, ownerField: "owner"},
  {allow: groups, groups: ["Agents"]}
]) {
  id: ID!
  title: String!
  status: TicketStatus!
  owner: String
}
type TicketSummary @aws_cognito_user_pools { id: ID!, title: String!, status: TicketStatus!, summary: String! }
type TicketComment @aws_cognito_user_pools { id: ID!, body: String!, authorId: String!, author: String!, createdAt: AWSDateTime! }
type Query {
  listTicketComments(id: ID!): [TicketComment!]
    @function(name: "ticketWorkflow")
    @auth(rules: [{allow: private, provider: userPools}])
  ticketSummary(id: ID!): TicketSummary
    @function(name: "ticketWorkflow")
    @auth(rules: [{allow: private, provider: userPools}])
}
type Mutation {
  addTicketComment(id: ID!, body: String!): TicketComment
    @function(name: "ticketWorkflow")
    @auth(rules: [{allow: private, provider: userPools}])
  closeTicket(id: ID!): Ticket
    @function(name: "ticketWorkflow")
    @auth(rules: [{allow: private, provider: userPools}])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: project5.branch,
      modelNameToTableNameMapping: {
        Ticket: 'Ticket-yfs4rx4ynvgulalyky2k3zfrxi-pftest',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
  schema,
  functions: { ticketWorkflow },
});

export function applyEscapeHatches(backend: Backend) {
  const resolver = backend.data.resources.cfnResources.cfnResolvers['Mutation.createTicket']
    ?? Object.values(backend.data.resources.cfnResources.cfnResolvers).find(
      candidate => candidate.typeName === 'Mutation' && candidate.fieldName === 'createTicket');
  if (!resolver || !resolver.requestMappingTemplate) throw new Error('createTicket pipeline missing');
  const ownerTemplate = MappingTemplate.fromFile(join(dirname(fileURLToPath(import.meta.url)), 'resolvers/Mutation.createTicket.preAuth.1.req.vtl'));
  resolver.requestMappingTemplate = ownerTemplate.renderTemplate().split('$util.toJson')[0] + '\n' + resolver.requestMappingTemplate;
}
