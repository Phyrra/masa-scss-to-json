const fs = require('fs');
const path = require('path');
const scssToJson = require('./masa-scss-to-json');

// 0: node / yarn
// 1: index.js
// 2: config.js
const configFile = process.argv[2];

if (!configFile || !fs.existsSync(configFile)) {
	throw new Error('Missing config');
}

const config = require(path.join(process.cwd(), configFile));

module.exports = {
	run: () => scssToJson(config.baseDir, config.file, config.out)
};
