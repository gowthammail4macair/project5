import { defineFunction } from '@aws-amplify/backend';
export const ticketAuthorizer = defineFunction({
  name: 'project5-ticketAuthorizer', entry: './handler.js', runtime: 22,
  timeoutSeconds: 25, memoryMB: 128, resourceGroupName: 'data',
});
