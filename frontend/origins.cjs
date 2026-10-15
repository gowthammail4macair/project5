// Hosting preparation records B's separate public origin before backend synthesis.
const hosting = require('./hosting.json');
module.exports = { allowedOrigins: [...new Set(['http://localhost:3000', hosting.url])] };
