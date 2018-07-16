function tokenize(grammarTokens, rootTokens, lines) { // without comments
	const tokens = [];

	let nextTokensStack = [rootTokens];

	let unterminatedStatement = false;

	for (let idx = 0; idx < lines.length; ++idx) {
		let debugLine = lines[idx];

		let skip = 0;
		let line = debugLine;

		while (line.length > 0) {
			const nextTokens = nextTokensStack[nextTokensStack.length - 1];

			const found = nextTokens
				.some(token => {
					const tokenExpression = grammarTokens[token];

					const match = line.match(tokenExpression.regExp);
					if (match) {
						tokens.push({
							match: match,
							token: token
						});

						line = line.replace(tokenExpression.regExp, '').trim();
						debugLine = line;

						if (tokenExpression.start) {
							unterminatedStatement = true;
						} else {
							nextTokensStack.pop();

							if (nextTokensStack.length === 0) {
								throw new Error(`Mismatched closing element ${match[0]}`);
							}
						}

						if (tokenExpression.next) {
							nextTokensStack.push(tokenExpression.next);
						} else {
							unterminatedStatement = false;
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
						`Could not match ${debugLine}`
					);
				}

				line = line + lines[idx + skip];
			}
		}

		idx += skip;
	}

	// TODO: Not quite sure about this one yet
	if (unterminatedStatement) {
		throw new Error(`Unterminated statement`);
	}

	return tokens;
}

module.exports = tokenize;
