const scanForXSS = require("./src/scanner");

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.log("Usage: node index.js http://example.com");
  process.exit(1);
}

scanForXSS(targetUrl);
