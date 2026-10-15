import { AmplifyApiGraphQlResourceStackTemplate } from '@aws-amplify/cli-extensibility-helper';

// B owns this setting during Project5 reference QA; retain it on every Gen1 push.
export function override(resources: AmplifyApiGraphQlResourceStackTemplate) {
  resources.models!.Ticket!.modelDDBTable!.addPropertyOverride('DeletionProtectionEnabled', true);
}
