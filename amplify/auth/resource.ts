import { referenceAuth } from '@aws-amplify/backend';
import { qaReferences } from '../project5';
export const auth = referenceAuth({
  userPoolId: qaReferences.userPoolId,
  userPoolClientId: qaReferences.userPoolClientId,
  identityPoolId: qaReferences.identityPoolId,
  authRoleArn: qaReferences.authRoleArn,
  unauthRoleArn: qaReferences.unauthRoleArn,
});
// B retains its clients, identity-pool configuration, Agents group and triggers.
