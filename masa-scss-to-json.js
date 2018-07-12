const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

function readFile(baseDir, file, variables) {
	if (!file.endsWith('.scss')) {
		file += '.scss';
	}

	const lines = removeCommentsFromLines(
		getCleanedLines(
			readLinesFromFile(file)
		)
	);

	lines
		.forEach(line => {
			const lowerLine = line.toLowerCase();

			if (isImport(lowerLine)) {
				const importFile = getImportFile(line);

				readFile(
					baseDir,
					getImportPath(baseDir, file, importFile),
					variables
				);

				return;
			}

			if (isVariableDefinition(lowerLine)) {
				const variable = getVariable(line);

				if (variables[variable.name]) {
					if (variable.default) {
						// continue, no error
					} else {
						throw new Error(`Variable ${variable.name} already exists, maybe missing "!default"`);
					}
				} else {
					variables[variable.name] = variable.value;
				}

				return;
			}
		});
}

function readLinesFromFile(file) {
	return fs.readFileSync(file, 'utf8')
		.split(/\n/);
}

function getCleanedLines(lines) {
	return lines
		.map(line => line.trim())
		.filter(line => line.length > 0);
}

function removeCommentsFromLines(lines) {
	let multiLineCommentStarted = false;

	return getCleanedLines(
		lines
			.map(line => {
				const idx = line.indexOf('//');

				if (idx !== -1) {
					return line.substring(0, idx - 1);
				}

				return line;
			})
			.map(line => {
				if (multiLineCommentStarted) {
					const idxStop = line.indexOf('*/');
					if (idxStop === -1) {
						return '';
					}

					multiLineCommentStarted = false;

					return line.substring(idxStop + 2);
				} else {
					const idxStart = line.indexOf('/*');
					if (idxStart === -1) {
						return line;
					}

					const idxStop = line.indexOf('*/', idxStart + 1);
					if (idxStop === -1) {
						multiLineCommentStarted = true;

						return '';
					}

					return line.substring(0, idxStart - 1) + line.substring(idxStop + 2);
				}
			})
	);
}

function isImport(line) {
	return line.startsWith('@import');
}

function getImportFile(line) {
	const readImport = char => {
		const idxStart = line.indexOf(char);
		const idxStop = line.indexOf(char, idxStart + 1);

		return line.substring(idxStart + 1, idxStop).trim();
	};

	if (line.match(/^@import\s+".*?";$/)) {
		return readImport('"');
	}

	if (line.match(/^@import\s+'.*?';$/)) {
		return readImport('\'');
	}

	throw new Error(`Bad import "${line}"`);
}

function getImportPath(baseDir, parentFile, importFile) {
	if (importFile.startsWith('~')) {
		return path.join(baseDir, importFile.substring(1));
	}

	return path.join(path.dirname(parentFile), importFile);
}

function isVariableDefinition(line) {
	return line.startsWith('$');
}

function getVariable(line) {
	if (!line.endsWith(';')) {
		throw new Error(`Missing semicolon ${line}`);
	}

	const idxColon = line.indexOf(':');
	if (idxColon === -1) {
		throw new Error(`Missing colon ${line}`);
	}

	const idxDefault = line.indexOf('!default');
	const idxImportant = line.indexOf('!important');

	const isDefault = idxDefault !== -1;
	if (isDefault) {
		const endOfDefault = idxDefault + 9;
		const endOfLine = line.length - 1;

		if (endOfDefault < endOfLine && line.substring(endOfDefault, endOfLine).trim().length > 0) {
			throw new Error(`Unknown parameter after !default`);
		}
	}

	const isImportant = idxImportant !== -1;

	let endIdx;
	if (isDefault) {
		endIdx = idxDefault;
	} else if (isImportant) {
		endIdx = idxImportant;
	} else {
		endIdx = line.length - 1;
	}

	return {
		name: line.substring(1, idxColon).trim(),
		value: getVariableValue(line.substring(idxColon + 1, endIdx).trim()),
		default: isDefault
	};
}

function getVariableValue(value) {
	if (value.startsWith('\'') && value.endsWith('\'')) {
		return value.substring(1, value.length - 1);
	}

	if (value.startsWith('"') && value.endsWith('"')) {
		return value.substring(1, value.length - 1);
	}

	if (value.match(/^[+-]?\d+$/)) {
		return parseInt(value);
	}

	if (value.match(/^[+-]?(\d*\.\d+|\d+\.\d*)$/)) {
		return parseFloat(value);
	}

	return value;
}

function writeJsonToFile(out, json) {
	const dir = path.dirname(out);
	if (!fs.existsSync(dir)) {
		mkdirp.sync(dir);
	}

	fs.writeFileSync(out, stringifyJson(json));
}

function stringifyJson(json) {
	return '{\r\n' +
		Object.keys(json)
			.map(key => {
				const value = json[key];

				if (typeof value === 'number') {
					return `\t"${key}": ${value}`;
				}

				return `\t"${key}": "${value}"`;
			})
			.join(',\r\n') +
		'\r\n}';
}

function scssToJson(baseDir, startFile, outFile) {
	const variables = {};

	readFile(baseDir, path.join(baseDir, startFile), variables);

	if (outFile != null) {
		writeJsonToFile(outFile, variables);
	}

	return variables;
}

module.exports = scssToJson
