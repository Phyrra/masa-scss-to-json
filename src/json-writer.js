const fs = require('fs');
const path = require('path');

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

function writeJsonToFile(baseDir, out, json) {
	let dir = path.dirname(out);
	if (!dir.startsWith('/')) { // relative path
		dir = path.join(baseDir, dir);
	}

	if (!fs.existsSync(dir)) {
		mkdirpSync(dir);
	}

	const fileName = path.basename(out);
	fs.writeFileSync(path.join(dir, fileName), stringifyJson(json));
}

function stringifyJson(json) {
	return '{\r\n' +
		Object.keys(json)
			.map(key => {
				const value = json[key];

				return `\t"${key}": ${getJsonValueString(value)}`;
			})
			.join(',\r\n') +
		'\r\n}';
}

function getJsonValueString(value) {
	if (typeof value === 'number') {
		return `${value}`;
	}

	if (Array.isArray(value)) {
		return '[\r\n' + value.map(val => '\t\t' + getJsonValueString(val)).join(',\r\n') + '\r\n\t]';
	}

	if (typeof value === 'object') {
		return '{\r\n' + Object.keys(value).map(key => `\t\t"${key}": ` + getJsonValueString(value[key])).join(',\r\n') + '\r\n\t}';
	}

	return `"${value.replace(/"/g, '\\"')}"`;
}
