import { defineFunction } from '@aws-amplify/backend';
export const ticketSocketHandler = defineFunction({
  name: 'project5-ticketSocketHandler', entry: './handler.js', runtime: 22,
  timeoutSeconds: 25, memoryMB: 128, resourceGroupName: 'data',
});
