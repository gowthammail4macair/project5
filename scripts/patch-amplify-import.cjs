// graphql-model-transformer 3.5.1 expects SSE.Status=ENABLED but omits Status
// from the live comparison object. Preserve the actual service status so KMS
// imports can pass, while disabled/updating encryption still fails validation.
const fs = require('node:fs');
const path = require('node:path');
function importerPaths() {
  return [...new Set(['@aws-amplify/graphql-api-construct', '@aws-amplify/data-construct'].map(parent => {
    const manifest = require.resolve('@aws-amplify/graphql-model-transformer/package.json', {
      paths: [path.dirname(require.resolve(parent + '/package.json'))],
    });
    if (require(manifest).version !== '3.5.1') throw new Error('Review the SSE import compatibility patch after upgrading Amplify');
    return path.join(path.dirname(manifest), 'lib/resources/amplify-dynamodb-table/amplify-table-manager-lambda/import-table.js');
  }))];
}
function patch() {
  for (const file of importerPaths()) {
    const original = 'SSEType: importedTable.SSEDescription.SSEType,';
    const fixed = original + '\n            Status: importedTable.SSEDescription.Status,';
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(fixed)) continue;
    if (content.split(original).length !== 2) throw new Error('Unexpected Amplify importer; refusing to patch ' + file);
    fs.writeFileSync(file, content.replace(original, fixed));
  }
}
if (require.main === module) { patch(); console.log('Amplify KMS import status comparison patch applied'); }
module.exports = { importerPaths, patch };
