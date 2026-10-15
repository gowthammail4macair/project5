import { handler as restHandler } from '../../../src/rest.cjs';

export async function handler(event, context) {
  console.info('PROJECT5_CICD_PROBE_20261015', {
    requestId: context?.awsRequestId,
    method: event.httpMethod,
    route: event.resource,
  });
  return restHandler(event, context);
}
