const tokenize = require('./tokenizer');

// TODO: @media rules

const Token = {
	IMPORT_DECLARATION: 'IMPORT_DECLARATION',
	VARIABLE_DECLARATION: 'VARIABLE_DECLARATION',
	VARIABLE_PLAIN_VALUE: 'VARIABLE_PLAIN_VALUE',
	VARIABLE_ARRAY_VALUE: 'VARIABLE_ARRAY_VALUE',
	ARRAY_VALUE: 'ARRAY_VALUE',
	ARRAY_SEPARATOR: 'ARRAY_SEPARATOR',
	ARRAY_END: 'ARRAY_END',
	VARIABLE_DEFAULT: 'VARIABLE_DEFAULT',
	STATEMENT_END: 'STATEMENT_END',
	RULE_START: 'RULE_START',
	BLOCK_END: 'BLOCK_END',
	PROPERTY_DECLARATION: 'PROPERTY_DECLARATION',
	PROPERTY_VALUE: 'PROPERTY_VALUE',
	PROPERTY_IMPORTANT: 'PROPERTY_IMPORTANT',
	CONTROL_BLOCK_START: 'CONTROL_BLOCK_START',
	INCLUDE_DECLARATION: 'INCLUDE_DECLARATION'
};

const TokenDefinition = {
	[Token.IMPORT_DECLARATION]: {
		regExp: new RegExp(/^@import\s+["']([^"']+)["']\s*;/)
	},
	[Token.VARIABLE_DECLARATION]: {
		regExp: new RegExp(/^\$([^:\s]+)\s*:/)
	},
	[Token.VARIABLE_PLAIN_VALUE]: {
		regExp: new RegExp(/^([^(][^!;]*)/)
	},
	[Token.VARIABLE_ARRAY_VALUE]: {
		regExp: new RegExp(/^\(/)
	},
	[Token.ARRAY_VALUE]: {
		regExp: new RegExp(/^([^,)]+)/)
	},
	[Token.ARRAY_SEPARATOR]: {
		regExp: new RegExp(/^,/)
	},
	[Token.ARRAY_END]: {
		regExp: new RegExp(/^\)/)
	},
	[Token.VARIABLE_DEFAULT]: {
		regExp: new RegExp(/^!default/)
	},
	[Token.STATEMENT_END]: {
		regExp: new RegExp(/^;/)
	},
	[Token.RULE_START]: {
		regExp: new RegExp(/^([^@$]([^#{]|#{?)*)\{/)
	},
	[Token.BLOCK_END]: {
		regExp: new RegExp(/^\}/)
	},
	[Token.PROPERTY_DECLARATION]: {
		regExp: new RegExp(/^([\w-]+)\s*:/)
	},
	[Token.PROPERTY_VALUE]: {
		regExp: new RegExp(/^([^!;]+)/)
	},
	[Token.PROPERTY_IMPORTANT]: {
		regExp: new RegExp(/^!important/)
	},
	[Token.CONTROL_BLOCK_START]: {
		regExp: new RegExp(/^@(\w+)\s*([^{]*)\{/)
	},
	[Token.INCLUDE_DECLARATION]: {
		regExp: new RegExp(/@include\s+([^;]+);/)
	}
};

const importStatement = {
	start: true,
	token: Token.IMPORT_DECLARATION
};

const arrayEnd = {
	token: Token.ARRAY_END,
	next: [
		{
			token: Token.VARIABLE_DEFAULT,
			next: [
				{
					token: Token.STATEMENT_END
				}
			]
		}, {
			token: Token.STATEMENT_END
		}
	]
};

const arrayValueLoop = {
	token: Token.ARRAY_VALUE,
	next: [
		arrayEnd,
		{
			token: Token.ARRAY_SEPARATOR,
			get next() {
				return [arrayValueLoop];
			}
		}
	]
};

const variableStatement = {
	start: true,
	token: Token.VARIABLE_DECLARATION,
	next: [
		{
			token: Token.VARIABLE_PLAIN_VALUE,
			next: [
				{
					token: Token.VARIABLE_DEFAULT,
					next: [
						{
							token: Token.STATEMENT_END
						}
					]
				}, {
					token: Token.STATEMENT_END
				}
			]
		}, {
			token: Token.VARIABLE_ARRAY_VALUE,
			next: [
				arrayEnd,
				arrayValueLoop
			]
		}
	]
};

const propertyStatement = {
	start: true,
	token: Token.PROPERTY_DECLARATION,
	next: [
		{
			token: Token.PROPERTY_VALUE,
			next: [
				{
					token: Token.STATEMENT_END
				}, {
					token: Token.PROPERTY_IMPORTANT,
					next: [
						{
							token: Token.STATEMENT_END
						}
					]
				}
			]
		}
	]
};

const includeStatement = {
	start: true,
	token: Token.INCLUDE_DECLARATION
};

let ruleStatement;
let blockStatement;

ruleStatement = {
	start: true,
	token: Token.RULE_START,
	get next() {
		return [
			{
				token: Token.BLOCK_END
			},
			ruleStatement,
			blockStatement,
			variableStatement,
			importStatement,
			includeStatement,
			propertyStatement
		];
	}
};

blockStatement = {
	start: true,
	token: Token.CONTROL_BLOCK_START,
	get next() {
		return [
			{
				token: Token.BLOCK_END
			},
			ruleStatement,
			blockStatement,
			variableStatement,
			importStatement,
			includeStatement,
			propertyStatement
		];
	}
};

const rootStatement = {
	start: true,
	next: [
		ruleStatement,
		blockStatement,
		importStatement,
		variableStatement,
		includeStatement
	]
}

function parseScss(lines) {
	const tokens = tokenize(
		TokenDefinition,
		rootStatement,
		lines
	);

	const _root = {
		imports: [],
		variables: [],
		rules: [],
		blocks: []
	};

	const stack = [_root];

	tokens.forEach(token => {
		const peek = stack[stack.length - 1];

		switch (token.token) {
			case Token.IMPORT_DECLARATION:
				peek.imports.push(token.match[1].trim());

				break;

			case Token.VARIABLE_DECLARATION:
				peek.variables.push({
					name: token.match[1].trim(),
					value: undefined,
					default: false
				});

				break;

			case Token.VARIABLE_PLAIN_VALUE:
				peek.variables[peek.variables.length - 1].value = getVariableValue(token.match[1].trim())

				break;

			case Token.VARIABLE_ARRAY_VALUE:
				peek.variables[peek.variables.length - 1].value = [];

				break;

			case Token.ARRAY_VALUE:
				peek.variables[peek.variables.length - 1].value.push(
					getVariableValue(token.match[0].trim())
				);

				break;

			case Token.ARRAY_SEPARATOR:
			case Token.ARRAY_END:
				// ignore

				break;

			case Token.VARIABLE_DEFAULT:
				peek.variables[peek.variables.length - 1].default = true

				break;

			case Token.STATEMENT_END:
				// ignore

				break;

			case Token.RULE_START:
				peek.rules.push({
					selector: token.match[1].trim(),
					imports: [],
					variables: [],
					rules: [],
					blocks: [],
					properties: []
				});

				stack.push(peek.rules[peek.rules.length - 1]);

				break;

			case Token.CONTROL_BLOCK_START:
				peek.blocks.push({
					type: token.match[1].trim(),
					condition: token.match[2].trim(),
					imports: [],
					variables: [],
					rules: [],
					blocks: [],
					properties: []
				});

				stack.push(peek.blocks[peek.blocks.length - 1]);

				break;

			case Token.BLOCK_END:
				stack.pop();

				break;

			case Token.PROPERTY_DECLARATION:
				peek.properties.push({
					name: token.match[1].trim(),
					value: undefined,
					important: false
				});

				break;

			case Token.PROPERTY_VALUE:
				peek.properties[peek.properties.length - 1].value = token.match[1].trim();

				break;

			case Token.PROPERTY_IMPORTANT:
				peek.properties[peek.properties.length - 1].important = true;

				break;

			case Token.INCLUDE_DECLARATION:
				// ignore

				break;

			default:
				throw new Error(`Unknown token ${token.token}`);
		}
	});

	return _root;
}

function getVariableValue(value) {
	if (value.startsWith('\'') && value.endsWith('\'')) {
		return value.substring(1, value.length - 1);
	}

	if (value.startsWith('"') && value.endsWith('"')) {
		return value.substring(1, value.length - 1);
	}

	if (value.match(/^[+-]?\d+$/)) {
		return parseInt(value, 10);
	}

	if (value.match(/^[+-]?(\d*\.\d+|\d+\.\d*)$/)) {
		return parseFloat(value);
	}

	return value;
}

module.exports = parseScss;
