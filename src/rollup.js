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

		// TODO: Check if this takes care of "linked replacements"
		// $a: 1; $b: $a; $c: $b;
		if (Array.isArray(variable.value)) {
			variable.value = variable.value.map(val => resolveVariableValues(val, totalMap));
		} else if (typeof variable.value === 'string') {
			variable.value = resolveVariableValues(variable.value, totalMap);
		}

		map[variable.name] = variable.value;
	});

	return map;
}

function replaceVariableValues(value, variables) {
	return value.replace(/\$[^\s]+/g, (grp) => {
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
		return parseInt(replaced);
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
