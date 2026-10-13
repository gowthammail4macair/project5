import { defineBackend } from '@aws-amplify/backend';
import { CfnResource, Tags } from 'aws-cdk-lib';
import { auth, applyEscapeHatches as authEscapeHatches } from './auth/resource';
import { data, applyEscapeHatches as dataEscapeHatches } from './data/resource';
import { ticketAuthorizer } from './function/ticketAuthorizer/resource';
import { ticketRest } from './function/ticketRest/resource';
import { ticketSocketHandler } from './function/ticketSocketHandler/resource';
import { ticketWorkflow } from './function/ticketWorkflow/resource';
import { defineSupportRestApi } from './api/supportRest/resource';
import { defineTicketSocket } from './custom/ticketSocket/resource';
import { wireBackend } from './manual-wiring';
import { project5 } from './project5';
export const backend = defineBackend({ auth, data, ticketAuthorizer, ticketRest, ticketSocketHandler, ticketWorkflow });
export type Backend = typeof backend;
if (backend.stack.node.tryGetContext('amplify-backend-type') !== 'branch'
    || backend.stack.node.tryGetContext('amplify-backend-name') !== project5.branch) {
  throw new Error('Project5 baseline requires its main branch context; use npm run synth, not sandbox');
}
authEscapeHatches(backend);
dataEscapeHatches(backend);
const socket = defineTicketSocket(backend);
wireBackend(backend, socket);
defineSupportRestApi(backend);
for (const node of backend.stack.node.root.node.findAll()) {
  if (CfnResource.isCfnResource(node) && node.cfnResourceType === 'Custom::ImportedAmplifyDynamoDBTable') {
    node.addPropertyOverride('deletionProtectionEnabled', true);
    node.addPropertyOverride('allowDestructiveGraphqlSchemaUpdates', false);
    node.addPropertyOverride('sseSpecification', { sseEnabled: true });
    node.addOverride('DeletionPolicy', 'Retain');
    node.addOverride('UpdateReplacePolicy', 'Retain');
  }
}
export function postRefactor() { Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true'); }
// Keep disabled in the managed baseline. Actual owner/name reconciliation is
// verified separately before a live refactor; this marker alone is insufficient.
// postRefactor();
