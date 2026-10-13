const { test } = require('node:test');
const assert = require('node:assert/strict');
const { importerPaths } = require('../scripts/patch-amplify-import.cjs');
for (const file of importerPaths()) test('KMS importer validates real encryption status: ' + file.split('/node_modules/').slice(1).join('/'), () => {
  const importer = require(file);
  const table = { AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }], BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
    ProvisionedThroughput: { ReadCapacityUnits: 0, WriteCapacityUnits: 0 },
    StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
    SSEDescription: { SSEType: 'KMS', Status: 'ENABLED' }, DeletionProtectionEnabled: true };
  const expected = importer.getExpectedTableProperties({ ...table, BillingMode: 'PAY_PER_REQUEST',
    SSESpecification: { Enabled: true, SSEType: 'KMS' } });
  const validate = actual => importer.validateImportedTableProperties(importer.getImportedTableComparisonProperties(actual), expected);
  assert.doesNotThrow(() => validate(table));
  for (const status of ['UPDATING', 'DISABLED', undefined]) assert.throws(() => validate({ ...table,
    SSEDescription: { SSEType: 'KMS', Status: status } }), /SSEDescription/);
  assert.throws(() => validate({ ...table, SSEDescription: undefined }), /SSEDescription/);
  assert.throws(() => validate({ ...table, DeletionProtectionEnabled: false }), /DeletionProtectionEnabled/);
  assert.throws(() => validate({ ...table, KeySchema: [{ AttributeName: 'other', KeyType: 'HASH' }] }), /KeySchema/);
  assert.throws(() => validate({ ...table, StreamSpecification: { StreamEnabled: true, StreamViewType: 'KEYS_ONLY' } }), /StreamSpecification/);
});
