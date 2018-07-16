// TODO: @mixin + @include
// TODO: @if / @else / ...
// TODO: @for

const Token = {
	IMPORT_DECLARATION: 'IMPORT_DECLARATION',
	VARIABLE_DECLARATION: 'VARIABLE_DECLARATION',
	ARRAY_DECLARATION: 'ARRAY_DECLARATION',
	ARRAY_VALUE: 'ARRAY_VALUE',
	ARRAY_SEPARATOR: 'ARRAY_SEPARATOR',
	ARRAY_END: 'ARRAY_END',
	RULE_START: 'RULE_START',
	BLOCK_END: 'BLOCK_END',
	PROPERTY: 'PROPERTY',
	CONTROL_BLOCK_START: 'CONTROL_BLOCK_START',
	INCLUDE_DECLARATION: 'INCLUDE_DECLARATION'
};

const TokenExpression = {
	[Token.IMPORT_DECLARATION]: {
		regExp: new RegExp(/^@import\s+["']([^"']+)["']\s*;/),
		start: true
	},
	[Token.VARIABLE_DECLARATION]: {
		regExp: new RegExp(/^\$([^:\s]+)\s*:\s*([^\s(][^;]*);/),
		start: true
	},
	[Token.ARRAY_DECLARATION]: {
		regExp: new RegExp(/^\$([^:\s]+)\s*:\s*\(/),
		next: [
			Token.ARRAY_VALUE,
			Token.ARRAY_END
		],
		start: true
	},
	[Token.ARRAY_VALUE]: {
		regExp: new RegExp(/^([^,)]+)/),
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
		regExp: new RegExp(/^\)\s*(!default)?\s*;/)
	},
	[Token.RULE_START]: {
		regExp: new RegExp(/^([^@][^{]*)\{/),
		next: [
			Token.IMPORT_DECLARATION,
			Token.VARIABLE_DECLARATION,
			Token.ARRAY_DECLARATION,
			Token.RULE_START,
			Token.BLOCK_END,
			Token.PROPERTY,
			Token.CONTROL_BLOCK_START,
			Token.INCLUDE_DECLARATION
		],
		start: true
	},
	[Token.BLOCK_END]: {
		regExp: new RegExp(/^\}/)
	},
	[Token.PROPERTY]: {
		regExp: new RegExp(/^([^$][^:\s]*)\s*:\s*([^;]+);/),
		start: true
	},
	[Token.CONTROL_BLOCK_START]: {
		regExp: new RegExp(/^@(\w+)\s+([^{]+)\{/),
		next: [
			Token.IMPORT_DECLARATION,
			Token.VARIABLE_DECLARATION,
			Token.ARRAY_DECLARATION,
			Token.RULE_START,
			Token.BLOCK_END,
			Token.PROPERTY,
			Token.CONTROL_BLOCK_START,
			Token.INCLUDE_DECLARATION
		],
		start: true
	},
	[Token.INCLUDE_DECLARATION]: {
		regExp: new RegExp(/@include\s+([^;]+);/),
		start: true
	}
};

function tokenize(lines) { // without comments
	const tokens = [];

	let nextTokensStack = [
		[
			Token.IMPORT_DECLARATION,
			Token.VARIABLE_DECLARATION,
			Token.ARRAY_DECLARATION,
			Token.RULE_START,
			Token.BLOCK_END,
			Token.PROPERTY,
			Token.CONTROL_BLOCK_START,
			Token.INCLUDE_DECLARATION
		]
	];

	for (let idx = 0; idx < lines.length; ++idx) {
		let debugLine = lines[idx];

		let skip = 0;
		let line = debugLine;

		while (line.length > 0) {
			const nextTokens = nextTokensStack[nextTokensStack.length - 1];

			const found = nextTokens
				.some(token => {
					const tokenExpression = TokenExpression[token];

					const match = line.match(tokenExpression.regExp);
					if (match) {
						tokens.push({
							match: match,
							token: token
						});

						line = line.replace(tokenExpression.regExp, '').trim();
						debugLine = line;

						if (!tokenExpression.start) {
							nextTokensStack.pop();

							if (nextTokensStack.length === 0) {
								throw new Error(`Mismatched closing element on line #${idx + 1}: ${match[0]}`);
							}
						}
						if (tokenExpression.next) {
							nextTokensStack.push(tokenExpression.next);
						}

						return true;
					}

					return false;
				});

			// prevent endless loop
			if (!found) {
				++skip;
				if (idx + skip >= lines.length) {
					throw new Error(
						`Could not match line #${idx + 1}: ${debugLine}`
					);
				}

				line = line + lines[idx + skip];
			}
		}

		idx += skip;
	}

	return tokens;
}

function parseScss(lines) {
	const tokens = tokenize(lines);

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

			case Token.PROPERTY:
				peek.properties.push(
					getProperty(token.match[1].trim(), token.match[2].trim())
				);

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

function getVariable(name, value) {
	const idxDefault = value.indexOf('!default');

	const isDefault = idxDefault !== -1;
	if (isDefault) {
		const endOfDefault = idxDefault + 8;
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
		const endOfImportant = idxImportant + 11;
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
