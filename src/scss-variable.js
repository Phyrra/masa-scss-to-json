const tokenize = require('./tokenizer');
const shuntingYard = require('./shunting-yard');

const Types = {
	ARRAY: 'ARRAY',
	MAP: 'MAP',
	VALUE: 'VALUE'
};

// TODO: Treat calculations

const Token = {
	TEXT: 'TEXT',
	COLOR: 'COLOR',
	NUMBER: 'NUMBER',
	UNIT: 'UNIT',
	VARIABLE: 'VARIABLE',
	FUNCTION: 'FUNCTION',
	ARGUMENT_SEPARATOR: 'ARGUMENT_SEPARATOR',
	FUNCTION_END: 'FUNCTION_END',
	CALCULATION_START: 'CALCULATION_START',
	BRACKET_OPEN: 'BRACKET_OPEN',
	BRACKET_CLOSE: 'BRACKET_CLOSE',
	OPERATOR: 'OPERATOR',
	CALCULATION_END: 'CALCULATION_END'
};

const TokenDefinition = {
	[Token.TEXT]: new RegExp(/^([a-zA-Z][\w-]*)(?=\)|,|\s|$)/),
	[Token.COLOR]: new RegExp(/^#([0-9a-fA-F]+)/),
	[Token.NUMBER]: new RegExp(/^([+-]?(\d*\.\d+|\d+\.\d*)|[+-]?\d+)/),
	[Token.UNIT]: new RegExp(/^([a-zA-Z%]+)/),
	[Token.VARIABLE]: new RegExp(/^\$([\w-]+)/),
	[Token.FUNCTION]: new RegExp(/^([a-zA-Z_][\w-]*)\s*\(/),
	[Token.ARGUMENT_SEPARATOR]: new RegExp(/^,/),
	[Token.FUNCTION_END]: new RegExp(/^\)/),
	[Token.CALCULATION_START]: new RegExp(/^#\{/),
	[Token.BRACKET_OPEN]: new RegExp(/^\(/),
	[Token.BRACKET_CLOSE]: new RegExp(/^\)/),
	[Token.OPERATOR]: new RegExp(/^([+\-*\/])/),
	[Token.CALCULATION_END]: new RegExp(/^\}/)
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

let calculationStatement;

const bracketStatement = [
	{
		token: Token.BRACKET_OPEN
	},
	{
		get statement() { return calculationStatement; }
	},
	{
		token: Token.BRACKET_CLOSE
	}
];

const calculationArgument = [
	{
		statement: numberStatement
	},
	{
		statement: bracketStatement
	},
	{
		token: Token.VARIABLE
	}
];

calculationStatement = [
	{
		canRepeat: true,
		statement: [
			calculationArgument,
			{
				token: Token.OPERATOR
			}
		]
	},
	calculationArgument
];

const calculationBlockStatement = [
	{
		token: Token.CALCULATION_START
	},
	[
		{
			statement: calculationStatement
		},
		{
			statement: [
				calculationArgument
			]
		}
	],
	{
		token: Token.CALCULATION_END
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

let functionStatement;

const functionArgument = [
	{
		statement: numberStatement
	},
	{
		statement: colorStatement
	},
	{
		statement: textStatement
	},
	{
		statement: variableStatement
	},
	{
		statement: calculationBlockStatement
	},
	{
		get statement() { return functionStatement; }
	}
];

const functionArgumentListStatement = [
	{
		canRepeat: true,
		statement: [
			functionArgument,
			{
				token: Token.ARGUMENT_SEPARATOR
			}
		]
	},
	functionArgument
];

functionStatement = [
	{
		token: Token.FUNCTION
	},
	[
		{
			empty: true
		},
		{
			statement: [
				functionArgument
			]
		},
		{
			statement: functionArgumentListStatement
		}
	],
	{
		token: Token.FUNCTION_END
	}
];

const valueStatement = [
	numberStatement,
	colorStatement,
	variableStatement,
	textStatement,
	functionStatement,
	calculationBlockStatement
];

const KNOWN_FUNCTIONS = {
	'nth': (args) => {
		if (args.length !== 2) {
			throw new Error(`Expected 2 arguments, got ${args.length}`);
		}

		const arrWrapper = args[0];
		if (arrWrapper.type !== Token.VARIABLE) {
			throw new Error(`Expected a variable as 1st argument, got ${arrWrapper.type}`);
		}

		const arrValue = arrWrapper.part;
		if (arrValue.type !== Types.ARRAY) {
			throw new Error(`Expected an array as 1st argument, got ${arrValue.type}`);
		}

		const arr = arrValue.value;

		const idxWrapper = args[1];
		let idxValue;
		if (idxWrapper.type === Token.NUMBER) {
			idxValue = idxWrapper.part;
		} else if (idxWrapper.type === Token.VARIABLE) {
			idxValue = collectValueParts(idxWrapper.part.value);
		} else {
			throw new Error(`Expected a number as 2nd argument, got ${idxWrapper.type}`)
		}

		let idx = checkIfNumeric(idxValue);
		if (typeof idx !== 'number') {
			throw new Error(`Expected int, got ${idx}`);
		}

		const intIdx = Math.floor(idx) - 1;
		if (intIdx >= arr.length) {
			throw new Error(`Array index out of bounds`);
		}

		return {
			type: Token.VARIABLE,
			part: arr[intIdx]
		};
	}
}

function checkIfNumeric(value) {
	if (typeof value === 'number') {
		return value;
	}

	if (value.match(/^[+-]?\d+$/)) {
		return parseInt(value, 10);
	}

	if (value.match(/^[+-]?(\d*\.\d+|\d+\.\d*)$/)) {
		return parseFloat(value);
	}

	return value;
}

function getVariable(variables, name) {
	if (!variables.hasOwnProperty(name)) {
		throw new Error(`Unknown variable ${name}`);
	}

	return variables[name];
}

function valueToString(value) {
	switch (value.type) {
		case Token.VARIABLE:
			return collectValueParts(value.part.value);

		case Token.TEXT:
			return value.part;

		case Token.NUMBER:
			return value.part + (value.unit ? value.unit : '');

		case Token.COLOR:
			return '#' + value.part;

		default:
			throw new Error(`Unknown type ${value.type}`);
	}
}

function collectValueParts(value) {
	const joined = value
		.map(val => valueToString(val))
		.join(' ');

	return checkIfNumeric(joined);
}

function parseValue(value, variables) {
	const tokens = tokenize(TokenDefinition, valueStatement, [value]);

	/*
	console.log(
		tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']')
	);
	*/

	const stack = [[]];

	tokens.forEach(token => {
		let peek = stack[stack.length - 1];

		switch (token.token) {
			case Token.TEXT:
				peek.push({
					type: Token.TEXT,
					part: token.match[1].trim()
				});

				break;

			case Token.COLOR:
				peek.push({
					type: Token.COLOR,
					part: token.match[1].trim()
				});

				break;

			case Token.NUMBER:
				peek.push({
					type: Token.NUMBER,
					part: Number(token.match[1].trim()),
					unit: undefined
				});

				break;

			case Token.UNIT:
				const prevNumber = peek[peek.length - 1];
				const unit = token.match[1].trim();

				if (prevNumber.unit) {
					throw new Error(`Cannot overwrite unit ${prevNumber.unit} with ${unit}`);
				}

				prevNumber.unit = unit;

				break;

			case Token.VARIABLE:
				const variableName = token.match[1].trim();

				peek.push({
					type: Token.VARIABLE,
					part: getVariable(variables, variableName),
					name: variableName
				});

				break;

			case Token.FUNCTION:
				stack.push([{
					type: Token.FUNCTION,
					part: token.match[1].trim()
				}]);

				break;

			case Token.ARGUMENT_SEPARATOR:
				// ignore

				break;

			case Token.FUNCTION_END:
				const functionName = peek[0].part;
				const functionArguments = peek.slice(1);

				stack.pop();
				peek = stack[stack.length - 1];

				if (KNOWN_FUNCTIONS.hasOwnProperty(functionName)) {
					peek.push(KNOWN_FUNCTIONS[functionName](functionArguments));
				} else {
					peek.push({
						type: Token.TEXT,
						part: functionName + '(' + functionArguments.map(val => valueToString(val)).join(', ') + ')'
					});
				}

				break;

			case Token.CALCULATION_START:
				stack.push([]);

				break;

			case Token.OPERATOR:
				peek.push({
					type: Token.OPERATOR,
					part: token.match[1].trim()
				});

				break;

			case Token.BRACKET_OPEN:
				peek.push({
					type: Token.BRACKET_OPEN,
					part: '('
				});

				break;

			case Token.BRACKET_CLOSE:
				peek.push({
					type: Token.BRACKET_CLOSE,
					part: ')'
				});

				break;

			case Token.CALCULATION_END:
				const calc = peek;

				stack.pop();
				peek = stack[stack.length - 1];

				peek.push(
					shuntingYard(
						calc
							.map(t => {
								if (t.type === Token.VARIABLE) {
									const variable = t.part;

									if (variable.type !== Types.VALUE) {
										throw new Error(`Non-value variable ${t.name} found in calculation`);
									}

									if (variable.value.length !== 1) {
										throw new Error(`Bad variable value ${collectValueParts(variable.value)} found in calculation`);
									}

									return variable.value[0];
								}

								return t;
							})
					)
				);

				break;

			default:
				throw new Error(`Unknown token ${token}`);
		}
	});

	return stack[stack.length - 1];
}

module.exports = {
	parseValue: parseValue,
	collectValue: collectValueParts,
	Types: Types
};
