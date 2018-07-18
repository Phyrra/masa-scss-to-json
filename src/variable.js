const tokenize = require('./tokenizer');

// TODO: Treat #{..}
// TODO: Treat calculations

const Token = {
	TEXT: 'TEXT',
	COLOR: 'COLOR',
	NUMBER: 'NUMBER',
	UNIT: 'UNIT',
	VARIABLE: 'VARIABLE',
	FUNCTION: 'FUNCTION',
	ARGUMENT: 'ARGUMENT',
	ARGUMENT_SEPARATOR: 'ARGUMENT_SEPARATOR',
	FUNCTION_END: 'FUNCTION_END',
	CALCULATION: 'CALCULATION',
	OPERATION: 'OPERATION'
};

const TokenDefinition = {
	[Token.TEXT]: new RegExp(/^([a-zA-Z_][\w-]*)/), // this will match function start foo( and catch it
	[Token.COLOR]: new RegExp(/^#([0-9a-fA-F]+)/),
	[Token.NUMBER]: new RegExp(/^([+-]?(\d*\.\d+|\d+\.\d*)|[+-]?\d+)/),
	[Token.UNIT]: new RegExp(/^([a-zA-Z%]+)/),
	[Token.FUNCTION]: new RegExp(/^([a-zA-Z_][\w-]*)\s*\(/),
	[Token.ARGUMENT_SEPARATOR]: new RegExp(/^,/),
	[Token.FUNCTION_END]: new RegExp(/^\)/),
	[Token.VARIABLE]: new RegExp(/^\$([\w-]+)/)
};

const numberStatement = [
	{
		token: Token.NUMBER
	},
	[
		{
			token: Token.UNIT
		},
		{
			empty: true
		}
	]
];

const colorStatement = [
	{
		token: Token.COLOR
	}
];

const textStatement = [
	{
		token: Token.TEXT
	}
];

const variableStatement = [
	{
		token: Token.VARIABLE
	}
];

const functionStatement = [
	{
		token: Token.FUNCTION
	},
	[
		numberStatement,
		colorStatement,
		textStatement,
		variableStatement
	].map(statement => {
		return {
			canRepeat: true,
			statement: [
				{
					statement: statement
				},
				[
					{
						token: Token.ARGUMENT_SEPARATOR
					},
					{
						empty: true
					}
				]
			]
		};
	}).concat([
		{
			canRepeat: true,
			statement: [
				{
					get statement() { return functionStatement; }
				},
				[
					{
						token: Token.ARGUMENT_SEPARATOR
					},
					{
						empty: true
					}
				]
			]
		},
		{
			empty: true
		}
	]),
	{
		token: Token.FUNCTION_END
	}
];

const valueStatement = [
	functionStatement, // must be before textStatement because of overlap
	numberStatement,
	colorStatement,
	variableStatement,
	textStatement
];

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
				throw new Error(`Unknown variable ${idxName}`);
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

function resolvePropertyValue(value, variables) {
	return replaceVariableValues(value, variables);
}

function getNumbersAsNumbers(value) {
	if (value.match(/^[+-]?\d+$/)) {
		return parseInt(value, 10);
	}

	if (value.match(/^[+-]?(\d*\.\d+|\d+\.\d*)$/)) {
		return parseFloat(value);
	}

	return value;
}

function resolveVariableValue(value, variables) {
	return getNumbersAsNumbers(
		replaceVariableValues(value.toString(), variables)
	);
}

function parseValue(value) {
	const tokens = tokenize(TokenDefinition, valueStatement, [value]);

	console.log(
		tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']')
	);
}

module.exports = {
	resolveVariable: resolveVariableValue,
	resolveProperty: resolvePropertyValue,
	parseValue: parseValue
};
