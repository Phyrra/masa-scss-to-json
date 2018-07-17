const tokenize = require('./tokenizer');

// TODO: Treat #{..}
// TODO: Treat calculations

const Token = {
	TEXT: 'TEXT',
	COLOR: 'COLOR',
	NUMBER: 'NUMBER',
	FUNCTION: 'FUNCTION',
	ARGUMENT: 'ARGUMENT',
	ARGUMENT_SEPARATOR: 'ARGUMENT_SEPARATOR',
	FUNCTION_END: 'FUNCTION_END',
	VARIABLE: 'VARIABLE',
	CALCULATION: 'CALCULATION',
	OPERATION: 'OPERATION'
};

const TokenDefinition = {
	[Token.TEXT]: {
		regExp: new RegExp(/^([a-zA-Z][\w-]*)(\s|$)/)
	},
	[Token.COLOR]: {
		regExp: new RegExp(/^#([0-9a-fA-F]+)/)
	},
	[Token.NUMBER]: {
		regExp: new RegExp(/^([+-]?(\d*\.\d+|\d+\.\d*)|[+-]?\d+)([a-zA-Z%]+)?/)
	},
	[Token.FUNCTION]: {
		regExp: new RegExp(/^([\w-]+)\s*\(/)
	},
	[Token.ARGUMENT_SEPARATOR]: {
		regExp: new RegExp(/^,/)
	},
	[Token.FUNCTION_END]: {
		regExp: new RegExp(/^\)/)
	},
	[Token.VARIABLE]: {
		regExp: new RegExp(/^\$([\w-]+)/)
	}
};

const numberStatement = {
	start: true,
	token: Token.NUMBER
};

const textStatement = {
	start: true,
	token: Token.TEXT
};

const colorStatement = {
	start: true,
	token: Token.COLOR
};

const variableStatement = {
	start: true,
	token: Token.VARIABLE
};

let functionNext;

const argumentNext = [
	{
		token: Token.ARGUMENT_SEPARATOR,
		get next() {
			return functionNext
		}
	}, {
		token: Token.FUNCTION_END
	}
];

const valueTokens = [
	Token.TEXT,
	Token.COLOR,
	Token.VARIABLE,
	Token.NUMBER
];

const fncArg = {
	token: Token.FUNCTION,
	get next() {
		return [
			{
				token: Token.FUNCTION_END,
				next: argumentNext
			}
		]
		.concat(valueTokens.map(token => {
			return {
				token: token,
				next: [
					{
						token: Token.FUNCTION_END,
						next: argumentNext
					}
				]
			}
		}))
		.concat([fncArg]);
	}
};

functionNext =
	valueTokens.map(token => {
		return {
			token: token,
			next: argumentNext
		}
	})
	.concat([fncArg]);

const functionStatement = {
	start: true,
	token: Token.FUNCTION,
	next: [
		{
			token: Token.FUNCTION_END
		}
	]
		.concat(functionNext)
};

const valueStatement = {
	start: true,
	get next() {
		return [
			textStatement,
			colorStatement,
			variableStatement,
			numberStatement,
			functionStatement
		];
	}
};

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
