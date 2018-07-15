const fs = require('fs');
const path = require('path');

const jsonStringify = require('./json');

function mkdirpSync(dir) {
	const dirs = path.normalize(dir)
		.replace(/\\/g, '/') // Windows
		.split('/');

	let fullPath;
	dirs.forEach(dir => {
		fullPath = fullPath ? path.join(fullPath, dir) : dir;

		if (!fs.existsSync(fullPath)) {
			fs.mkdirSync(fullPath);
		}
	});
}

function writeDataToFile(baseDir, out, data) {
	let dir = path.dirname(out);
	if (!dir.startsWith('/')) { // relative path
		dir = path.join(baseDir, dir);
	}

	if (!fs.existsSync(dir)) {
		mkdirpSync(dir);
	}

	const fileName = path.basename(out);
	fs.writeFileSync(
		path.join(dir, fileName),
		typeof data === 'object' ? jsonStringify(data) : data
	);
}

module.exports = writeDataToFile;
