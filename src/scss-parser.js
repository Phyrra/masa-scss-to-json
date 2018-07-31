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
	VARIABLE_GLOBAL: 'VARIABLE_GLOBAL',
	STATEMENT_END: 'STATEMENT_END',
	RULE_START: 'RULE_START',
	BLOCK_END: 'BLOCK_END',
	PROPERTY_DECLARATION: 'PROPERTY_DECLARATION',
	PROPERTY_VALUE: 'PROPERTY_VALUE',
	PROPERTY_IMPORTANT: 'PROPERTY_IMPORTANT',
	CONTROL_BLOCK_START: 'CONTROL_BLOCK_START',
	INCLUDE_DECLARATION: 'INCLUDE_DECLARATION',
	MEDIA_START: 'MEDIA_START',
	MEDIA_TYPE: 'MEDIA_TYPE',
	MEDIA_RULE: 'MEDIA_RULE',
	MEDIA_BLOCK_START: 'MEDIA_BLOCK_START'
};

const TokenDefinition = {
	[Token.IMPORT_DECLARATION]: new RegExp(/^@import\s+["']([^"']+)["']\s*;/i),
	[Token.VARIABLE_DECLARATION]: new RegExp(/^\$([^:\s]+)\s*:/),
	[Token.VARIABLE_PLAIN_VALUE]: new RegExp(/^([^(][^!;\n]*)/),
	[Token.VARIABLE_OBJECT_VALUE]: new RegExp(/^\(/),
	[Token.ARRAY_VALUE]: new RegExp(/^([^,):]+)/),
	[Token.MAP_ENTRY_DECLARATION]: new RegExp(/^([\w-]+)\s*:/),
	[Token.MAP_ENTRY_VALUE]: new RegExp(/^([^,)]+)/),
	[Token.OBJECT_VALUE_SEPARATOR]: new RegExp(/^,/),
	[Token.OBJECT_END]: new RegExp(/^\)/),
	[Token.VARIABLE_DEFAULT]: new RegExp(/^!\s*default/i),
	[Token.VARIABLE_GLOBAL]: new RegExp(/^!\s*global/i),
	[Token.STATEMENT_END]: new RegExp(/^;/),
	[Token.RULE_START]: new RegExp(/^([^@${}()]([^#{;]|#{?)*)\{/),
	[Token.BLOCK_END]: new RegExp(/^\}/),
	[Token.PROPERTY_DECLARATION]: new RegExp(/^([\w-]+)\s*:/),
	[Token.PROPERTY_VALUE]: new RegExp(/^([^!;\n]+)/),
	[Token.PROPERTY_IMPORTANT]: new RegExp(/^!\s*important/i),
	[Token.CONTROL_BLOCK_START]: new RegExp(/^@((?!media)\w+)\s*([^{;]*)\{/),
	[Token.INCLUDE_DECLARATION]: new RegExp(/^@include\s+([^;]+);/i),
	[Token.MEDIA_START]: new RegExp(/^@media/i),
	[Token.MEDIA_TYPE]: new RegExp(/^((not|only)\s+)?(\w+)\s+/),
	[Token.MEDIA_RULE]: new RegExp(/^(and|or|not)\s+\(([\w-]+):\s*([^\)]+)\)/),
	[Token.MEDIA_BLOCK_START]: new RegExp(/^\{/)
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
	[
		{
			statement: [
				{
					token: Token.ARRAY_VALUE
				},
				{
					token: Token.OBJECT_VALUE_SEPARATOR
				},
				{
					get statement() { return multiArrayValueStatement; }
				}
			]
		},
		{
			token: Token.ARRAY_VALUE
		}
	]
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
	[
		{
			statement: [
				{
					statement: mapEntryStatement
				},
				{
					token: Token.OBJECT_VALUE_SEPARATOR
				},
				{
					get statement() { return multiMapValueStatement; }
				}
			]
		},
		{
			statement: mapEntryStatement
		}
	]
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
			token: Token.VARIABLE_DEFAULT
		},
		{
			token: Token.VARIABLE_GLOBAL
		},
		{
			empty: true
		}
	],
	{
		token: Token.STATEMENT_END
	}
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
let mediaRuleStatement;

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
					get statement() { return mediaRuleStatement; }
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

mediaRuleStatement = [
	{
		token: Token.MEDIA_START
	},
	{
		token: Token.MEDIA_TYPE
	},
	[
		{
			canRepeat: true,
			token: Token.MEDIA_RULE
		},
		{
			empty: true
		}
	],
	{
		token: Token.MEDIA_BLOCK_START
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
	mediaRuleStatement,
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
					default: false,
					global: false
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

			case Token.VARIABLE_GLOBAL:
				const globalVariable = peek.variables.pop();
				globalVariable.global = true;

				_root.variables.push(
					globalVariable
				);

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

			case Token.MEDIA_START:
				peek.rules.push({
					media: true,
					mediaType: null,
					mediaConditions: [],
					imports: [],
					variables: [],
					rules: [],
					blocks: [],
					properties: []
				});

				stack.push(peek.rules[peek.rules.length - 1]);

				break;

			case Token.MEDIA_TYPE:
				peek.mediaType = {
					modifier: token.match[1] ? token.match[1].trim() : null,
					type: token.match[3].trim()
				};

				break;

			case Token.MEDIA_RULE:
				peek.mediaConditions.push({
					modifier: token.match[1].trim(),
					property: token.match[2].trim(),
					value: token.match[3].trim()
				});

				break;

			case Token.MEDIA_BLOCK_START:
				// ignore

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
