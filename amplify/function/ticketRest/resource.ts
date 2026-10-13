import { defineFunction } from '@aws-amplify/backend';
export const ticketRest = defineFunction({
  name: 'project5-ticketRest', entry: './handler.js', runtime: 22,
  timeoutSeconds: 25, memoryMB: 128, resourceGroupName: 'data',
});
