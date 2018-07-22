const tokenize = require('./tokenizer');
const { Types } = require('./scss-variable');

// TODO: @media rules

const Token = {
	IMPORT_DECLARATION: 'IMPORT_DECLARATION',
	VARIABLE_DECLARATION: 'VARIABLE_DECLARATION',
	VARIABLE_PLAIN_VALUE: 'VARIABLE_PLAIN_VALUE',
	VARIABLE_OBJECT_VALUE: 'VARIABLE_OBJECT_VALUE',
	ARRAY_VALUE: 'ARRAY_VALUE',
	MAP_ENTRY_DECLARATION: 'MAP_VALUE',
	MAP_ENTRY_VALUE: 'MAP_ENTRY_VALUE',
	OBJECT_VALUE_SEPARATOR: 'OBJECT_VALUE_SEPARATOR',
	OBJECT_END: 'OBJECT_END',
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
	[Token.VARIABLE_OBJECT_VALUE]: new RegExp(/^\(/),
	[Token.ARRAY_VALUE]: new RegExp(/^([^,):]+)/),
	[Token.MAP_ENTRY_DECLARATION]: new RegExp(/^([\w-]+)\s*:/),
	[Token.MAP_ENTRY_VALUE]: new RegExp(/^([^,)]+)/),
	[Token.OBJECT_VALUE_SEPARATOR]: new RegExp(/^,/),
	[Token.OBJECT_END]: new RegExp(/^\)/),
	[Token.VARIABLE_DEFAULT]: new RegExp(/^!\s*default/),
	[Token.STATEMENT_END]: new RegExp(/^;/),
	[Token.RULE_START]: new RegExp(/^([^@${}()]([^#{;]|#{?)*)\{/),
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

const multiArrayValueStatement = [
	{
		canRepeat: true,
		statement: [
			{
				token: Token.ARRAY_VALUE
			},
			{
				token: Token.OBJECT_VALUE_SEPARATOR
			}
		]
	},
	{
		token: Token.ARRAY_VALUE
	}
];

const mapEntryStatement = [
	{
		token: Token.MAP_ENTRY_DECLARATION
	},
	{
		token: Token.MAP_ENTRY_VALUE
	}
];

const multiMapValueStatement = [
	{
		canRepeat: true,
		statement: [
			{
				statement: mapEntryStatement
			},
			{
				token: Token.OBJECT_VALUE_SEPARATOR
			}
		]
	},
	{
		statement: mapEntryStatement
	}
];

const objectVariableStatement = [
	{
		token: Token.VARIABLE_OBJECT_VALUE
	},
	[
		{
			statement: multiArrayValueStatement
		},
		{
			statement: multiMapValueStatement
		},
		{
			token: Token.ARRAY_VALUE
		},
		{
			statement: mapEntryStatement
		},
		{
			empty: true
		}
	],
	{
		token: Token.OBJECT_END
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
			statement: objectVariableStatement
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

const blockContentStatement = [
	{
		canRepeat: true,
		statement: [
			[
				{
					get statement() { return ruleStatement; }
				},
				{
					get statement() { return blockStatement; }
				},
				{
					statement: variableStatement
				},
				{
					statement: importStatement
				},
				{
					statement: includeStatement
				},
				{
					statement: propertyStatement
				}
			]
		]
	}
];

ruleStatement = [
	{
		token: Token.RULE_START
	},
	[
		{
			statement: blockContentStatement
		},
		{
			empty: true
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
			statement: blockContentStatement
		},
		{
			empty: true
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

	let prevToken = null;
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
					type: null,
					value: null,
					default: false
				});

				break;

			case Token.VARIABLE_PLAIN_VALUE:
				const plainWrapper = peek.variables[peek.variables.length - 1];
				plainWrapper.type = Types.VALUE;

				plainWrapper.value = getVariableValue(token.match[1].trim());

				break;

			case Token.VARIABLE_OBJECT_VALUE:
				// ignore

				break;

			case Token.ARRAY_VALUE:
				const arrayWrapper = peek.variables[peek.variables.length - 1];
				arrayWrapper.type = Types.ARRAY;

				if (arrayWrapper.value == null) {
					arrayWrapper.value = [];
				}

				arrayWrapper.value.push(
					getVariableValue(token.match[0].trim())
				);

				break;

			case Token.MAP_ENTRY_DECLARATION:
				const objectWrapper = peek.variables[peek.variables.length - 1];
				objectWrapper.type = Types.MAP;

				if (objectWrapper.value == null) {
					objectWrapper.value = {};
				}

				const objectPropertyName = token.match[1].trim();
				if (objectWrapper.value.hasOwnProperty(objectPropertyName)) {
					throw new Error(`Duplicate property ${objectPropertyName} in ${peek.variables[peek.variables.length - 1].name}`);
				}

				objectWrapper.value[objectPropertyName] = null;

				break;

			case Token.MAP_ENTRY_VALUE:
				peek.variables[peek.variables.length - 1].value[prevToken.match[1].trim()] = token.match[0].trim();

				break;

			case Token.OBJECT_VALUE_SEPARATOR:
				// ignore

				break;

			case Token.OBJECT_END:
				const objectEndWrapper = peek.variables[peek.variables.length - 1];
				if (objectEndWrapper.type == null) {
					objectEndWrapper.type = Types.ARRAY;
					objectEndWrapper.value = [];
				}

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

		prevToken = token;
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
