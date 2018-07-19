const fs = require('fs');
const path = require('path');

function readFile(baseDir, file, variables) {
	if (!file.endsWith('.scss')) {
		file += '.scss';
	}

	const lines = splitMultiDeclarations(
		removeRulesFromLines(
			removeCommentsFromLines(
				getCleanedLines(
					readLinesFromFile(file)
				)
			)
		)
	);

	let arrayBuffer = [];
	let arrayBufferFilling = false;

	lines
		.forEach(line => {
			const lowerLine = line.toLowerCase();

			if (arrayBufferFilling) {
				arrayBuffer.push(line);

				if (isArrayEnding(lowerLine)) {
					addVariable(
						getArrayVariable(arrayBuffer, variables),
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

				readFile(
					baseDir,
					getImportPath(baseDir, file, importFile),
					variables
				);

				return;
			}

			if (isVariableDefinition(lowerLine)) {
				if (isArrayStart(line)) {
					if (isArrayEnding(line)) {
						addVariable(
							getArrayVariable([line], variables),
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
				while (line.length > 0) {
					if (multiLineCommentStarted) {
						const idxStop = line.indexOf('*/');
						if (idxStop === -1) {
							/*
							 * ... Middle ...
							 */
							return '';
						}

						multiLineCommentStarted = false;

						/*
						 * Block end ...
						 */
						line = line.substring(idxStop + 2).trim();
					} else {
						const idxStart = line.indexOf('/*');
						if (idxStart === -1) {
							const lineIdx = line.indexOf('//');
							if (lineIdx === -1) {
								/*
								 * No comment
								 */
								break;
							}
							
							/*
							 * ... // comment
							 */
							line = line.substring(0, lineIdx).trim();
							break;
						}

						const idxStop = line.indexOf('*/', idxStart + 1);
						if (idxStop === -1) {
							multiLineCommentStarted = true;
	
							/*
							 * ... /*
							 */
							line = line.substring(0, idxStart);
							break;
						}

						/*
						 * Comment start ... Comment end ...
						 */
						line = (line.substring(0, idxStart - 1) + line.substring(idxStop + 2)).trim();
					}
				}

				return line;
			})
	);
}

function removeRulesFromLines(lines) {
	let ruleStack = 0;

	return getCleanedLines(
		lines
			.map(line => {
				const matchStart = isRuleStart(line);
				let matchEnd;

				if (matchStart) {
					++ruleStack;

					matchEnd = isRuleEnd(
						line.substring(matchStart[0].length + 1)
					);

					if (matchEnd) {
						--ruleStack;

						/*
						* .selector { property: value; } ...
						*/
						if (ruleStack === 0) {
							return line.substring(matchStart[0].length + 1 + matchEnd[0].length + 1).trim();
						}
					}

					/*
					 * ... .selector {
					 */
					return line.substring(0, matchStart.index);
				}

				matchEnd = isRuleEnd(line);
				if (matchEnd) {
					--ruleStack;

					/*
					 * } ...
					 */
					if (ruleStack === 0) {
						return line.substring(matchEnd[0].length + 1).trim();
					}
				}

				if (ruleStack > 0) {
					return '';
				}

				return line;
			})
	);
}

function isRuleStart(line) {
	return line.match(/^[^@${}()]([^#{;]|#{?)*\{/);
}

function isRuleEnd(line) {
	return line.match(/\s*[^}]*\}/);
}

function splitMultiDeclarations(lines) {
	return getCleanedLines(
		lines
			.map(line => line.split(/([^;]+;)/))
			.reduce((all, splits) => all.concat(splits), [])
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

function isArrayStart(line) {
	return line.match(/^\$(\w|-)+:\s*\(/);
}

function cleanArrayStart(line) {
	return line.replace(/^\$(\w|-)+:\s*\(/, '');
}

function isArrayEnding(line) {
	return line.match(/\)\s*(!default)?\s*;$/);
}

function cleanArrayEnding(line) {
	return line.replace(/\)\s*(!default)?\s*;$/, '');
}

function getArrayVariable(lines, variables) {
	const firstLine = lines[0];
	const lastLine = lines[lines.length - 1];

	const idxColon = firstLine.indexOf(':');
	const name = firstLine.substring(1, idxColon).trim();

	const isDefault = lastLine.indexOf('!default') !== -1;

	lines[0] = cleanArrayStart(lines[0]);
	lines[lines.length - 1] = cleanArrayEnding(lines[lines.length - 1]);

	return {
		name: name,
		value: getArrayValues(lines, variables),
		default: isDefault
	};
}

function getArrayValues(lines, variables) {
	return splitLinesToArrayValues(lines)
		.map(line => {
			return getVariableValue(
				replaceVariableValues(line, variables)
			);
		});
}

function splitLinesToArrayValues(lines) {
	return lines
		.reduce((values, line) => values.concat(line.split(',')), [])
		.map(line => line.trim())
		.filter(line => line.length > 0);
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
	return value.replace(/\$[\w-]+/g, (grp) => {
		const varName = grp.substring(1);

		if (!variables.hasOwnProperty(varName)) {
			throw new Error(`Unknown variable ${varName}`);
		}

		return variables[varName];
	});
}

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

	return `"${value.replace(/"/g, '\\"')}"`;
}

function scssToJson(baseDir, startFile, outFile) {
	const variables = {};

	readFile(baseDir, path.join(baseDir, startFile), variables);

	if (outFile != null) {
		writeJsonToFile(baseDir, outFile, variables);
	}

	return variables;
}

module.exports = scssToJson
