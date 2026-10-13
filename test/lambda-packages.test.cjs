const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '..');
test('Gen2 ESM handlers bundle the unchanged runtime and expose a Lambda handler', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'project5-lambda-check-'));
  try {
    for (const name of ['ticketRest','ticketWorkflow','ticketAuthorizer','ticketSocketHandler']) {
      const entry = path.join(root,'amplify/function',name,'handler.js');
      const bundle = buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',target:'node22',write:false});
      const file=path.join(temp,name+'.cjs'); fs.writeFileSync(file,bundle.outputFiles[0].contents);
      assert.equal(typeof require(file).handler,'function',name);
      assert.equal(fs.existsSync(path.join(root,'amplify/function',name,'index.js')),false,'Obsolete CommonJS entry removed');
    }
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});
