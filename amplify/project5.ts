// B remains the configuration owner throughout reference QA.
export const project5 = {
  branch: 'main',
  sourceEnvironment: 'pftest',
  ticketTable: 'Ticket-yfs4rx4ynvgulalyky2k3zfrxi-pftest',
  notificationsReady: false,
};
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('Set reference-QA input: ' + name);
  return value;
}
export const qaReferences = {
  userPoolId: required('TEST_USER_POOL_ID'),
  userPoolClientId: required('TEST_WEB_CLIENT_ID'),
  identityPoolId: required('TEST_IDENTITY_POOL_ID'),
  authRoleArn: required('TEST_AUTH_ROLE_ARN'),
  unauthRoleArn: required('TEST_UNAUTH_ROLE_ARN'),
  connectionsTableArn: required('TEST_CONNECTIONS_TABLE_ARN'),
  ticketStreamArn: required('TEST_TICKET_STREAM_ARN'),
  sourceWebsocketApiId: required('TEST_SOURCE_WEBSOCKET_API_ID'),
  sourceWebsocketStage: required('TEST_SOURCE_WEBSOCKET_STAGE'),
};
const region = qaReferences.userPoolId.split('_')[0];
const account = qaReferences.authRoleArn.split(':')[4];
if (qaReferences.userPoolId !== 'ap-south-1_zgT2JWoBE'
    || qaReferences.userPoolClientId !== '6ugasqqj1n74lb521orpj047pd'
    || account !== '112097210422'
    || qaReferences.sourceWebsocketApiId !== 'a61vb7pyxd'
    || !/^\d{12}$/.test(account)
    || !qaReferences.authRoleArn.startsWith(`arn:aws:iam::${account}:role/`)
    || !qaReferences.unauthRoleArn.startsWith(`arn:aws:iam::${account}:role/`)
    || !qaReferences.identityPoolId.startsWith(region + ':')
    || qaReferences.connectionsTableArn !== `arn:aws:dynamodb:${region}:${account}:table/Connections-${qaReferences.userPoolId}`
    || !qaReferences.ticketStreamArn.startsWith(`arn:aws:dynamodb:${region}:${account}:table/${project5.ticketTable}/stream/`)
    || !/^[a-z0-9]+$/.test(qaReferences.sourceWebsocketApiId)
    || qaReferences.sourceWebsocketStage !== project5.sourceEnvironment) {
  throw new Error('B reference inputs have inconsistent account/region/resource identities');
}
export const qaAllowedOrigins: string[] = JSON.parse(process.env.PROJECT5_ALLOWED_ORIGINS ?? '["http://localhost:3000"]');
if (!Array.isArray(qaAllowedOrigins) || !qaAllowedOrigins.length || !qaAllowedOrigins.every(origin => {
  try { const url = new URL(origin); return url.origin === origin && (url.protocol === 'https:' || origin === 'http://localhost:3000'); }
  catch { return false; }
})) throw new Error('PROJECT5_ALLOWED_ORIGINS must be a JSON array of HTTPS origins or http://localhost:3000');
