function tokenize(grammarTokens, rootStatement, lines) { // without comments
	const tokens = [];

	let nextTokensStack = [rootStatement.next];

	for (let idx = 0; idx < lines.length; ++idx) {
		let debugLine = lines[idx];

		let skip = 0;
		let line = debugLine;

		while (line.length > 0) {
			const nextTokens = nextTokensStack[nextTokensStack.length - 1];

			const found = nextTokens
				.some(node => {
					const token = node.token;

					if (!grammarTokens.hasOwnProperty(token)) {
						console.log(
							'FOUND_TOKENS',
							tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']')
						);
	
						console.log(
							'NEXT_TOKENS',
							nextTokens.map(token => token.token)
						);

						throw new Error(`Unknown token ${token}`);
					}
					const tokenExpression = grammarTokens[token].regExp;

					const match = line.match(tokenExpression);
					if (match) {
						tokens.push({
							match: match,
							token: token
						});

						line = line.replace(tokenExpression, '').trim();
						debugLine = line;

						if (!node.start) {
							nextTokensStack.pop();

							if (nextTokensStack.length === 0) {
								throw new Error(`Mismatched closing element ${match[0]}`);
							}
						}

						if (node.next) {
							nextTokensStack.push(node.next);
						}

						return true;
					}

					return false;
				});

			// prevent endless loop
			if (!found) {
				++skip;
				if (idx + skip >= lines.length) {
					console.log(
						'FOUND_TOKENS',
						tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']')
					);

					console.log(
						'NEXT_TOKENS',
						nextTokens.map(token => token.token)
					);

					throw new Error(
						`Could not match ${debugLine}`
					);
				}

				line = line + lines[idx + skip];
			}
		}

		idx += skip;
	}

	// TODO: Not quite sure about this one yet
	nextTokensStack.pop();
	if (nextTokensStack.length > 0) {
		console.log(
			'FOUND_TOKENS',
			tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']')
		);

		console.log(
			nextTokensStack.length,
			'NEXT_TOKENS',
			nextTokensStack[nextTokensStack.length - 1].map(token => token.token)
		);

		throw new Error(`Unterminated statement`);
	}

	return tokens;
}

module.exports = tokenize;
