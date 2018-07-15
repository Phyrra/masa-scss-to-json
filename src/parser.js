// TODO: @mixin + @include

const Token = {
	IMPORT_DECLARATION: 'IMPORT_DECLARATION',
	VARIABLE_DECLARATION: 'VARIABLE_DECLARATION',
	ARRAY_DECLARATION: 'ARRAY_DECLARATION',
	ARRAY_VALUE: 'ARRAY_VALUE',
	ARRAY_SEPARATOR: 'ARRAY_SEPARATOR',
	ARRAY_END: 'ARRAY_END',
	RULE_START: 'RULE_START',
	RULE_END: 'RULE_END',
	PROPERTY: 'PROPERTY'
};

const BASE_TOKENS = [
	Token.IMPORT_DECLARATION,
	Token.VARIABLE_DECLARATION,
	Token.ARRAY_DECLARATION,
	Token.RULE_START,
	Token.RULE_END,
	Token.PROPERTY
];

const TokenExpression = {
	[Token.IMPORT_DECLARATION]: {
		regExp: new RegExp(/^@import\s+["']([^"']+)["']\s*;/),
		next: BASE_TOKENS
	},
	[Token.VARIABLE_DECLARATION]: {
		regExp: new RegExp(/^\$([^:\s]+)\s*:\s*([^;(]*);/),
		next: BASE_TOKENS
	},
	[Token.ARRAY_DECLARATION]: {
		regExp: new RegExp(/^\$([^:\s]+)\s*:\s*\(/),
		next: [
			Token.ARRAY_VALUE,
			Token.ARRAY_END
		]
	},
	[Token.ARRAY_VALUE]: {
		regExp: new RegExp(/^([^,)]*)/),
		next: [
			Token.ARRAY_SEPARATOR,
			Token.ARRAY_END
		]
	},
	[Token.ARRAY_SEPARATOR]: {
		regExp: new RegExp(/^,/),
		next: [
			Token.ARRAY_VALUE
		]
	},
	[Token.ARRAY_END]: {
		regExp: new RegExp(/^\)\s*(!default)?\s*;/),
		next: BASE_TOKENS
	},
	[Token.RULE_START]: {
		regExp: new RegExp(/^([^{]*)\{/),
		next: BASE_TOKENS
	},
	[Token.RULE_END]: {
		regExp: new RegExp(/^\}/),
		next: BASE_TOKENS
	},
	[Token.PROPERTY]: {
		regExp: new RegExp(/^([^$][^:\s]*)\s*:\s*([^;]*);/),
		next: BASE_TOKENS
	}
};

function tokenize(lines) { // without comments
	const r = new RegExp(/^\$(\w|-)+\s*:\s*([^;]*);/);

	const tokens = [];
	let nextTokens = BASE_TOKENS;

	for (let idx = 0; idx < lines.length; ++idx) {
		const origLine = lines[idx];

		let skip = 0;
		let line = origLine;

		while (line.length > 0) {
			const lengthBefore = line.length;

			nextTokens
				.some(token => {
					const match = line.match(TokenExpression[token].regExp);
					if (match) {
						tokens.push({
							match: match,
							token: token
						});

						line = line.replace(TokenExpression[token].regExp, '').trim();
						nextTokens = TokenExpression[token].next;
					}
				});

			// prevent endless loop
			if (lengthBefore === line.length) {
				++skip;
				if (idx + skip >= lines.length) {
					throw new Error(
						`Could not match line #${idx + 1}: ${origLine} (allowed Tokens: [${nextTokens.join(', ')}])`
					);
				}

				line = line + lines[idx + skip];
			}
		}

		idx += skip;
	}

	return tokens;
}

function validate(tokens) {
	const stack = [];

	tokens.forEach(token => {
		switch (token.token) {
			case Token.IMPORT_DECLARATION:
				if (stack.length !== 0) {
					throw new Error('Import is only allowed in root');
				}

				break;
			
			case Token.RULE_START:
				stack.push(token);
				
				break;

			case Token.RULE_END:
				if (stack.length === 0) {
					throw new Error('Mismatched rule closing bracket');
				}

				break;

			case Token.PROPERTY:
				if (stack.length === 0) {
					throw new Error('Properties are only allowed inside rules');
				}

				break;
			
			default:
				// Nothing to do
		}
	})
}

function parseScss(lines) {
	const tokens = tokenize(lines);
	validate(tokens);

	const _root = {
		imports: [],
		variables: [],
		rules: []
	};

	const stack = [_root];

	tokens.forEach(token => {
		const peek = stack[stack.length - 1];

		switch (token.token) {
			case Token.IMPORT_DECLARATION:
				peek.imports.push(token.match[1].trim());

				break;

			case Token.VARIABLE_DECLARATION:
				peek.variables.push(
					getVariable(token.match[1].trim(), token.match[2].trim())
				);
				
				break;

			case Token.ARRAY_DECLARATION:
				peek.variables.push({
					name: token.match[1].trim(),
					value: []
				});
				
				break;

			case Token.ARRAY_VALUE:
				peek.variables[peek.variables.length - 1].value.push(
					getVariableValue(token.match[0].trim())
				);

				break;

			case Token.ARRAY_SEPARATOR:
				// ignore

				break;

			case Token.ARRAY_END:
				if (token.match[1]) {
					peek.variables[peek.variables.length - 1].default = true
				}

				break;

			case Token.RULE_START:
				peek.rules.push({
					selector: token.match[1].trim(),
					variables: [],
					rules: [],
					properties: []
				});

				stack.push(peek.rules[peek.rules.length - 1]);

				break;

			case Token.RULE_END:
				stack.pop();

				break;

			case Token.PROPERTY:
				peek.properties.push(
					getProperty(token.match[1].trim(), token.match[2].trim())
				);

				break;

			default:
				throw new Error(`Unknown token ${token.token}`);
		}
	});

	return _root;
}

function getVariable(name, value) {
	const idxDefault = value.indexOf('!default');

	const isDefault = idxDefault !== -1;
	if (isDefault) {
		const endOfDefault = idxDefault + 9;
		const endOfLine = value.length;

		if (endOfDefault < endOfLine && value.substring(endOfDefault, endOfLine).trim().length > 0) {
			throw new Error(`Unknown parameter after !default`);
		}
	}

	let endIdx;
	if (isDefault) {
		endIdx = idxDefault;
	} else {
		endIdx = value.length;
	}

	return {
		name: name,
		value: getVariableValue(value.substring(0, endIdx).trim()),
		default: isDefault
	};
}

function getVariableValue(value) {
	if (value.startsWith('\'') && value.endsWith('\'')) {
		return value.substring(1, value.length - 1);
	}

	if (value.startsWith('"') && value.endsWith('"')) {
		return value.substring(1, value.length - 1);
	}

	if (value.match(/^[+-]?\d+$/)) {
		return parseInt(value);
	}

	if (value.match(/^[+-]?(\d*\.\d+|\d+\.\d*)$/)) {
		return parseFloat(value);
	}

	return value;
}

function getProperty(name, value) {
	const idxImportant = value.indexOf('!important');

	const isImportant = idxImportant !== -1;
	if (isImportant) {
		const endOfImportant = idxImportant + 9;
		const endOfLine = value.length;

		if (endOfImportant < endOfLine && value.substring(endOfImportant, endOfLine).trim().length > 0) {
			throw new Error(`Unknown parameter after !important`);
		}
	}

	let endIdx;
	if (isImportant) {
		endIdx = idxImportant;
	} else {
		endIdx = value.length;
	}

	return {
		name: name,
		value: value.substring(0, endIdx).trim(),
		important: isImportant
	};
}

module.exports = parseScss;
