import { defineFunction } from '@aws-amplify/backend';
export const ticketWorkflow = defineFunction({
  name: 'project5-ticketWorkflow', entry: './handler.js', runtime: 22,
  timeoutSeconds: 25, memoryMB: 128, resourceGroupName: 'data',
});
