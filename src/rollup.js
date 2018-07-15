const path = require('path');

const reader = require('./reader');
const parser = require('./parser');

function collapse(baseDir, parentFile, data) {
	data.imports.forEach(importFile => {
		const result = parser(
			reader(
				getImportPath(baseDir, parentFile, importFile)
			)
		);

		collapse(baseDir, importFile, result);

		result.rules.forEach(rule => data.rules.unshift(rule));
		result.variables.forEach(variable => data.variables.unshift(variable));
	});
}

function getImportPath(baseDir, parentFile, importFile) {
	if (importFile.startsWith('~')) {
		return path.join(baseDir, importFile.substring(1));
	}

	return path.join(path.dirname(parentFile), importFile);
}

function rollupVariables(parentScope, variables) {
	const map = {};

	variables.forEach(variable => {
		if (map.hasOwnProperty(variable.name)) {
			if (variable.default) {
				return; // nothing to do
			}

			throw new Error(`Variable ${variable.name} already exists, maybe missing "!default"`);
		}

		const totalMap = Object.assign({}, parentScope, map);

		if (Array.isArray(variable.value)) {
			variable.value = variable.value.map(val => resolveVariableValues(val, totalMap));
		} else if (typeof variable.value === 'string') {
			variable.value = resolveVariableValues(variable.value, totalMap);
		}

		map[variable.name] = variable.value;
	});

	return map;
}

const KNOWN_FUNCTIONS = {
	'nth': (args, variables) => {
		if (!args[0].startsWith('$')) {
			throw new Error(`Expected variable, got ${args[0]}`);
		}

		const arrName = args[0].substring(1);
		if (!variables.hasOwnProperty(arrName)) {
			throw new Error(`Unknown variable ${arrName}`);
		}

		const arr = variables[arrName];
		if (!Array.isArray(arr)) {
			throw new Error(`Expected array, got ${typeof arr}`);
		}

		let idx;
		if (args[1].startsWith('$')) {
			const idxName = args[1].substring(1);
			if (!variables.hasOwnProperty(idxName)) {
				throw new Error()
			}

			idx = variables[idxName];
		} else {
			idx = args[1];
		}

		if (!idx.toString().match(/^\d+$/)) {
			throw new Error(`Expected int, got ${idx}`);
		}

		const intIdx = parseInt(idx, 10) - 1;
		if (intIdx >= arr.length) {
			throw new Error(`Array index out of bounds`);
		}

		return arr[intIdx];
	}
}

function replaceVariableValues(value, variables) {
	return value
		.replace(/([\w-]+)\(([^\)]*)\)/g, (grp) => {
			const match = grp.match(/([\w-]+)\(([^\)]*)\)/);

			if (KNOWN_FUNCTIONS.hasOwnProperty(match[1])) {
				const args = match[2].split(',')
					.map(arg => arg.trim());

				return KNOWN_FUNCTIONS[match[1]](args, variables);
			}

			return grp;
		})
		.replace(/\$[^\s,]+/g, (grp) => {
			const name = grp.substring(1);

			if (!variables.hasOwnProperty(name)) {
				throw new Error(`Unknown variable ${name}`);
			}

			return variables[name].toString();
		}).trim();
}

function resolveVariableValues(value, variables) {
	const replaced = replaceVariableValues(value.toString(), variables);

	if (replaced.match(/^[+-]?\d+$/)) {
		return parseInt(replaced, 10);
	}

	if (replaced.match(/^[+-]?(\d*\.\d+|\d+\.\d*)$/)) {
		return parseFloat(replaced);
	}

	return replaced;
}

function finalizeBlock(parentScope, data) {
	const allRolledUpVariables = Object.assign(
		{},
		parentScope,
		rollupVariables(parentScope, data.variables)
	);

	const result = {
		variables: rollupVariables(parentScope, data.variables),
		rules: data.rules.map(rule => finalizeBlock(allRolledUpVariables, rule))
	};

	if (data.hasOwnProperty('selector')) {
		result.selector = data.selector;
	}

	if (data.hasOwnProperty('properties')) {
		result.properties = data.properties.map(
			property => Object.assign(property, { value: replaceVariableValues(property.value, allRolledUpVariables) })
		)
	}

	return result;
}

module.exports = (baseDir, file) => {
	const startFile = path.join(baseDir, file);

	const result = parser(
		reader(startFile)
	);

	collapse(baseDir, startFile, result);

	return finalizeBlock({}, result);
};
