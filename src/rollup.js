const path = require('path');

const reader = require('./scss-reader');
const parser = require('./scss-parser');
const { parseValue, collectValue, Types } = require('./scss-variable');

function mergeFileToBlock(baseDir, parentFile, importFile, block) {
	const result = parser(
		reader(
			getImportPath(baseDir, parentFile, importFile)
		)
	);

	collapseImports(baseDir, importFile, result);

	result.rules.forEach(newRule => block.rules.unshift(newRule));
	result.variables.forEach(newVariable => block.variables.unshift(newVariable));
}

function collapseImports(baseDir, parentFile, block) {
	block.imports.forEach(importFile => {
		mergeFileToBlock(baseDir, parentFile, importFile, block);
	});

	block.rules.forEach(rule => {
		rule.imports.forEach(importFile => {
			mergeFileToBlock(baseDir, parentFile, importFile, rule);
		});
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
		if (parentScope.hasOwnProperty(variable.name)) {
			throw new Error(`Variable ${variable.name} already exists in parent scope`);
		}

		if (map.hasOwnProperty(variable.name)) {
			if (variable.default) {
				return; // nothing to do
			}

			throw new Error(`Variable ${variable.name} already exists, maybe missing "!default"`);
		}

		const totalMap = Object.assign({}, parentScope, map);

		let resolvedValue = {
			type: null,
			value: null
		};

		if (variable.type === Types.ARRAY) {
			resolvedValue.type = Types.ARRAY;

			resolvedValue.value = variable.value
				.map(val => {
					return {
						type: Types.VALUE,
						value: parseValue(val, totalMap)
					}
				});
		} else if (variable.type === Types.MAP) {
			resolvedValue.type = Types.MAP;

			resolvedValue.value = {};
			Object.keys(variable.value)
				.forEach(key => {
					if (resolvedValue.value.hasOwnProperty(key)) {
						throw new Error(`Duplicate property ${key} in ${variable.name}`);
					}

					resolvedValue.value[key] = {
						type: Types.VALUE,
						value: parseValue(variable.value[key], totalMap)
					};
				});
		} else {
			resolvedValue.type = Types.VALUE;

			resolvedValue.value = parseValue(variable.value, totalMap);
		}

		map[variable.name] = resolvedValue;
	});

	return map;
}

function updateVariablesAndProperties(data, parentScope) {
	const allRolledUpVariables = Object.assign(
		{},
		parentScope,
		rollupVariables(parentScope, data.variables)
	);

	const result = {
		variables: rollupVariables(parentScope, data.variables),
		rules: data.rules.map(rule => updateVariablesAndProperties(rule, allRolledUpVariables))
	};

	if (data.hasOwnProperty('selector')) {
		result.selector = data.selector;
	}

	if (data.hasOwnProperty('properties')) {
		result.properties = data.properties.map(
			property => Object.assign(
				property,
				{
					value: collectValue(
						parseValue(property.value, allRolledUpVariables)
					)
				}
			)
		);
	}

	if (data.media) {
		result.media = true;

		result.mediaType = data.mediaType;

		result.mediaConditions = data.mediaConditions.map(
			condition => Object.assign(
				condition,
				{
					value: collectValue(
						parseValue(condition.value, allRolledUpVariables)
					)
				}
			)
		);
	}

	return result;
}

function finalizeVariables(data) {
	const variables = {};
	Object.keys(data.variables)
		.forEach(key => {
			const wrappedValue = data.variables[key];

			if (wrappedValue.type === Types.ARRAY) {
				variables[key] = wrappedValue.value
					.map(element => collectValue(element.value));
			} else if (wrappedValue.type === Types.MAP) {
				variables[key] = {};
				Object.keys(wrappedValue.value)
					.forEach(propertyKey => variables[key][propertyKey] = collectValue(wrappedValue.value[propertyKey].value));
			} else {
				variables[key] = collectValue(wrappedValue.value);
			}
		});

	data.variables = variables;

	data.rules.forEach(rule => finalizeVariables(rule));
}

module.exports = (baseDir, file) => {
	const startFile = path.join(baseDir, file);

	const result = parser(
		reader(startFile)
	);

	collapseImports(baseDir, startFile, result);

	const updatedResult = updateVariablesAndProperties(result, {});
	finalizeVariables(updatedResult);

	return updatedResult;
};
