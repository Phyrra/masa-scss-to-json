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
	[Token.IMPORT_DECLARATION]: new RegExp(/^@import\s+["']([^"']+)["']\s*;/),
	[Token.VARIABLE_DECLARATION]: new RegExp(/^\$([^:\s]+)\s*:/),
	[Token.VARIABLE_PLAIN_VALUE]: new RegExp(/^([^(][^!;\n]*)/),
	[Token.VARIABLE_ARRAY_VALUE]: new RegExp(/^\(/),
	[Token.ARRAY_VALUE]: new RegExp(/^([^,)]+)/),
	[Token.ARRAY_SEPARATOR]: new RegExp(/^,/),
	[Token.ARRAY_END]: new RegExp(/^\)/),
	[Token.VARIABLE_DEFAULT]: new RegExp(/^!\s*default/),
	[Token.STATEMENT_END]: new RegExp(/^;/),
	[Token.RULE_START]: new RegExp(/^([^@$]([^#{;]|#{?)*)\{/),
	[Token.BLOCK_END]: new RegExp(/^\}/),
	[Token.PROPERTY_DECLARATION]: new RegExp(/^([\w-]+)\s*:/),
	[Token.PROPERTY_VALUE]: new RegExp(/^([^!;\n]+)/),
	[Token.PROPERTY_IMPORTANT]: new RegExp(/^!\s*important/),
	[Token.CONTROL_BLOCK_START]: new RegExp(/^@(\w+)\s*([^{;]*)\{/),
	[Token.INCLUDE_DECLARATION]: new RegExp(/^@include\s+([^;]+);/)
};

const importStatement = [
	{
		token: Token.IMPORT_DECLARATION
	}
];

const plainVariableStatement = [
	{
		token: Token.VARIABLE_PLAIN_VALUE
	}
];

const arrayVariableStatement = [
	{
		token: Token.VARIABLE_ARRAY_VALUE
	},
	[
		{
			token: Token.ARRAY_VALUE
		},
		{
			canRepeat: true,
			statement: [
				{
					token: Token.ARRAY_VALUE
				},
				{
					token: Token.ARRAY_SEPARATOR
				}
			]
		},
		{
			empty: true
		}
	],
	{
		token: Token.ARRAY_END
	}
];

const variableStatement = [
	{
		token: Token.VARIABLE_DECLARATION,
	},
	[
		{
			statement: plainVariableStatement
		},
		{
			statement: arrayVariableStatement
		}
	],
	[
		{
			token: Token.STATEMENT_END
		},
		{
			statement: [
				{
					token: Token.VARIABLE_DEFAULT
				},
				{
					token: Token.STATEMENT_END
				}
			]
		}
	]
];

const propertyStatement = [
	{
		token: Token.PROPERTY_DECLARATION
	},
	{
		token: Token.PROPERTY_VALUE
	},
	[
		{
			token: Token.PROPERTY_IMPORTANT
		},
		{
			empty: true
		}
	],
	{
		token: Token.STATEMENT_END
	}
];

const includeStatement = [
	{
		token: Token.INCLUDE_DECLARATION
	}
];

let ruleStatement;
let blockStatement;

ruleStatement = [
	{
		token: Token.RULE_START
	},
	[
		{
			canRepeat: true,
			get statement() { return ruleStatement; }
		},
		{
			canRepeat: true,
			get statement() { return blockStatement; }
		},
		{
			canRepeat: true,
			statement: variableStatement
		},
		{
			canRepeat: true,
			statement: importStatement
		},
		{
			canRepeat: true,
			statement: includeStatement
		},
		{
			canRepeat: true,
			statement: propertyStatement
		}
	],
	{
		token: Token.BLOCK_END
	}
];

blockStatement = [
	{
		token: Token.CONTROL_BLOCK_START
	},
	[
		{
			canRepeat: true,
			get statement() { return ruleStatement; }
		},
		{
			canRepeat: true,
			get statement() { return blockStatement; }
		},
		{
			canRepeat: true,
			statement: variableStatement
		},
		{
			canRepeat: true,
			statement: importStatement
		},
		{
			canRepeat: true,
			statement: includeStatement
		},
		{
			canRepeat: true,
			statement: propertyStatement
		}
	],
	{
		token: Token.BLOCK_END
	}
];

const scssStatement = [
	ruleStatement,
	blockStatement,
	importStatement,
	variableStatement,
	includeStatement
];

function parseScss(lines) {
	const tokens = tokenize(
		TokenDefinition,
		scssStatement,
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
