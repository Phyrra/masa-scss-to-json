let TokenDefinitions = {};

function travelAst(tokenDefinitions, root, lines) {
	// This is a hack to not have to pass the token definitions along
	Object.assign(TokenDefinitions, tokenDefinitions);

	let oneLine = lines.join('\n').trim(); // Screw whitespace, let's do it later

	let tokens = [];

	while (oneLine.length > 0) {
		const found = root.some(statement => {
			const match = canMatchStatement(statement, 0, oneLine, []);
			if (match) {
				oneLine = match.line;
				tokens = tokens.concat(match.tokens);

				return true;
			}

			return false;
		});

		if (!found) {
			console.log(
				'FOUND_TOKENS',
				tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']')
			);

			throw new Error(`Could not match ${oneLine}`);
		}
	}

	//console.log(tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ' + ']')));

	return tokens;
}

function canMatchStatement(statement, i, line, tokens) {
	if (i >= statement.length) {
		return {
			tokens: tokens,
			line: line
		};
	}

	const part = statement[i];

	if (Array.isArray(part)) {
		let partials = part
			.map(option => {
				const match = canMatchPart(option, line);
				if (match) {
					return {
						part: option,
						match: match
					};
				}

				return null;
			})
			.filter(match => !!match);

		if (partials.length > 1) {
			// If empty is an option, discard it if there is another match
			partials = partials
				.filter(partial => partial.match.tokens.length > 0);
		}

		const matches = partials
			.map(partial => {
				if (partial.part.canRepeat) {
					const match = canMatchStatement(statement, i, partial.match.line, partial.match.tokens);
					if (match) {
						return match;
					}
				}

				return canMatchStatement(statement, i + 1, partial.match.line, partial.match.tokens);
			})
			.filter(match => !!match);

		if (matches.length === 0) {
			return null;
		}

		if (matches.length > 1) {
			console.log(
				'FOUND_TOKENS',
				tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']')
			);

			matches.forEach(match => {
				console.log((match.tokens || []).map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']'))
			});

			throw new Error(`Multiple matches for ${line}`);
		}

		return {
			tokens: tokens.concat(matches[0].tokens),
			line: matches[0].line
		};
	}

	const match = canMatchPart(part, line);
	if (match) {
		if (part.canRepeat) {
			const repeatMatch = canMatchStatement(statement, i, match.line, match.tokens);
			if (repeatMatch) {
				return {
					tokens: tokens.concat(repeatMatch.tokens),
					line: repeatMatch.line
				};
			}
		}

		const nextMatch = canMatchStatement(statement, i + 1, match.line, match.tokens);
		if (nextMatch) {
			return {
				tokens: tokens.concat(nextMatch.tokens),
				line: nextMatch.line
			};
		}
	}

	return null;
}

function canMatchPart(part, line) {
	//console.log('checking', part, 'against', line);
	if (part.statement) {
		return canMatchStatement(part.statement, 0, line, []);
	}

	if (part.token) {
		const match = line.match(TokenDefinitions[part.token]);
		if (match) {
			//console.log('matched', part.token, match[0]);

			return {
				tokens: [{
					token: part.token,
					match: match
				}],
				line: line.replace(TokenDefinitions[part.token], '').trim()
			};
		}

		return null;
	}

	if (part.empty) {
		return {
			tokens: [],
			line: line
		};
	}

	console.log(part);
	throw new Error(`Unknown part`);
}

module.exports = travelAst;
