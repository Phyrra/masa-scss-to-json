const path = require('path');

const reader = require('./src/scss-reader');
const calculator = require('./src/calculator');

function processFile(baseDir, file, variables) {
	let arrayBuffer = [];
	let arrayBufferFilling = false;

	reader(file)
		.forEach(line => {
			const lowerLine = line.toLowerCase();

			if (arrayBufferFilling) {
				arrayBuffer.push(line);

				if (isObjectEnding(lowerLine)) {
					addVariable(
						getObjectVariable(arrayBuffer, variables),
						variables
					);

					arrayBuffer = [];
					arrayBufferFilling = false;

					return;
				}

				return;
			}

			if (isImport(lowerLine)) {
				const importFile = getImportFile(line);

				processFile(
					baseDir,
					getImportPath(baseDir, file, importFile),
					variables
				);

				return;
			}

			if (isVariableDefinition(lowerLine)) {
				if (isObjectStart(line)) {
					if (isObjectEnding(line)) {
						addVariable(
							getObjectVariable([line], variables),
							variables
						);

						return;
					}

					arrayBuffer.push(line);
					arrayBufferFilling = true;

					return;
				}

				addVariable(
					getVariable(line, variables),
					variables
				);

				return;
			}

			// ignore everything else
		});
}

function addVariable(variable, variables) {
	if (variables.hasOwnProperty(variable.name)) {
		if (variable.default) {
			// continue, no error
		} else {
			throw new Error(`Variable ${variable.name} already exists, maybe missing "!default"`);
		}
	} else {
		variables[variable.name] = variable.value;
	}
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

function isObjectStart(line) {
	return line.match(/^\$(\w|-)+:\s*\(/);
}

function cleanArrayStart(line) {
	return line.replace(/^\$(\w|-)+:\s*\(/, '');
}

function isObjectEnding(line) {
	return line.match(/\)\s*(!default)?\s*;$/);
}

function cleanArrayEnding(line) {
	return line.replace(/\)\s*(!default)?\s*;$/, '');
}

function getObjectVariable(lines, variables) {
	const firstLine = lines[0];
	const lastLine = lines[lines.length - 1];

	const idxColon = firstLine.indexOf(':');
	const name = firstLine.substring(1, idxColon).trim();

	const isDefault = lastLine.indexOf('!default') !== -1;

	lines[0] = cleanArrayStart(lines[0]);
	lines[lines.length - 1] = cleanArrayEnding(lines[lines.length - 1]);

	return {
		name: name,
		value: getObjectValues(name, lines, variables),
		default: isDefault
	};
}

function getObjectValues(name, lines, variables) {
	const values = splitObjectValueLines(lines)
		.map(line => getObjectVariableValue(line, variables));

	if (values.length === 0) {
		return values;
	}

	const isFirstAMapValue = typeof values[0] === 'object';

	/*
	 * Map
	 */

	if (isFirstAMapValue) {
		if (!values.every(value => typeof value === 'object')) {
			throw new Error(`Cannot mix array and map values for ${name}`);
		}

		const map = {};
		values.forEach(elem => {
			if (map.hasOwnProperty(elem.name)) {
				throw new Error(`Duplicate property ${elem.name} in ${name}`);
			}

			map[elem.name] = elem.value;
		});

		return map;
	}

	/*
	 * Value
	 */

	if (values.some(value => typeof value === 'object')) {
		throw new Error(`Cannot mix array and map values for ${name}`);
	}

	return values;
}

function splitObjectValueLines(lines) {
	return lines
		.reduce((values, line) => values.concat(line.split(',')), [])
		.map(line => line.trim())
		.filter(line => line.length > 0);
}

function getObjectVariableValue(value, variables) {
	const colonIdx = value.indexOf(':');
	if (colonIdx === -1) {
		return getVariableValue(
			replaceVariableValues(value, variables)
		);
	}

	return {
		name: value.substring(0, colonIdx).trim(),
		value: getVariableValue(
			replaceVariableValues(
				value.substring(colonIdx + 1).trim(),
				variables
			)
		)
	};
}

function getVariable(line, variables) {
	if (!line.endsWith(';')) {
		throw new Error(`Missing semicolon ${line}`);
	}

	const idxColon = line.indexOf(':');
	if (idxColon === -1) {
		throw new Error(`Missing colon ${line}`);
	}

	const idxDefault = line.indexOf('!default');

	const isDefault = idxDefault !== -1;
	if (isDefault) {
		const endOfDefault = idxDefault + 9;
		const endOfLine = line.length - 1;

		if (endOfDefault < endOfLine && line.substring(endOfDefault, endOfLine).trim().length > 0) {
			throw new Error(`Unknown parameter after !default`);
		}
	}

	let endIdx;
	if (isDefault) {
		endIdx = idxDefault;
	} else {
		endIdx = line.length - 1;
	}

	return {
		name: line.substring(1, idxColon).trim(),
		value: getVariableValue(
			replaceVariableValues(
				line.substring(idxColon + 1, endIdx).trim(),
				variables
			)
		),
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

function replaceVariableValues(value, variables) {
	return value
		.replace(/\$[\w-]+/g, (grp) => {
			const varName = grp.substring(1);

			if (!variables.hasOwnProperty(varName)) {
				throw new Error(`Unknown variable ${varName}`);
			}

			return variables[varName];
		})
		.replace(/#\{[^}]+\}/g, (grp) => {
			return calculator(grp.substring(2, grp.length - 1));
		});
}

function scssToJson(baseDir, startFile, outFile) {
	const variables = {};

	processFile(baseDir, path.join(baseDir, startFile), variables);

	if (outFile != null) {
		writeJsonToFile(baseDir, outFile, variables);
	}

	return variables;
}

module.exports = scssToJson
