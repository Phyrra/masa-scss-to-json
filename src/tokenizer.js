/*
enum Token {
	...
}

interface TokenDefinition {
	(key: Token): RegExp
}

interface IToken {
	token: Token;
	match: match;
}

interface IResult {
	line: string;
	tokens: IToken[];
}

interface StatementNode {
	canRepeat: boolean;
	statement?: Statement;
	token?: Token;
}

type Statement = (StatementNode | StatementNode[])[];
*/

const TokenDefinitions = {};

function travelAst(tokenDefinitions/*: */, root/*: Statement[]*/, lines/*: string[]*/)/*: IToken[] */ {
	// This is a hack to not have to pass the token definitions along
	Object.assign(TokenDefinitions, tokenDefinitions);

	// Screw whitespace, let's do it later
	let oneLine/*: string*/ = lines.join('\n').trim();

	let tokens/*: IToken[]*/ = [];

	while (oneLine.length > 0) {
		const found/*: boolean*/ = root.some((statement/*: Statement*/) => {
			const results/*: IResult[]*/ = [];
			canMatchStatement(statement, 0, oneLine, [], results);

			if (results.length === 0) {
				return false;
			}

			if (results.length > 1) {
				console.log(
					'FOUND_MATCHES',
					results.map(result =>
						result.tokens.map(
							token => token.token + ' [' + token.match.slice(1).join(', ') + ']'
						)
					)
				);

				throw new Error(`Multiple matches for ${oneLine}`);
			}

			oneLine = results[0].line;
			tokens = tokens.concat(results[0].tokens);

			return true;
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

function canMatchStatement(statement/*: Statement*/, i/*: number*/, line/*: string*/, tokens/*: IToken[]*/, results/*: IResult[]*/)/*: void*/ {
	if (i >= statement.length) {
		results.push({
			line: line,
			tokens: tokens
		});

		return;
	}

	const part/*: StatementNode | StatementNode[]*/ = statement[i];

	if (Array.isArray(part)) {
		const partials = part
			.map((option/*: StatementNode*/) => {
				if (option.canRepeat) {
					throw new Error(`Repeat in options is not allowed`);
				}

				return canMatchPart(option, line);
			})
			.reduce((allPartialMatches, partials) => allPartialMatches.concat(partials), []);

		// In case of multiple matches, throw away empty ones
		let filteredPartials/*: IResult[] */;
		if (partials.length > 1) {
			filteredPartials = partials.filter((partial/*: IResult*/) => partial.tokens.length > 0);
		} else {
			filteredPartials = partials;
		}

		filteredPartials
			.forEach((partial/*: IResult*/) => canMatchStatement(statement, i + 1, partial.line, tokens.concat(partial.tokens), results));

		return;
	}

	canMatchPart(part, line)
		.forEach((partial/*: IResult*/) => {
			if (part.canRepeat) {
				canMatchStatement(statement, i, partial.line, tokens.concat(partial.tokens), results);
			}

			canMatchStatement(statement, i + 1, partial.line, tokens.concat(partial.tokens), results)
		});
}

function canMatchPart(part/*: RuleNode */, line/*: string*/)/*: IResult[] */ {
	//console.log('matching', part, 'against', line);

	if (part.statement) {
		const nestedResults/*: IResult[]*/ = [];
		canMatchStatement(part.statement, 0, line, [], nestedResults);

		return nestedResults;
	}

	if (part.token) {
		const match/* string[]*/ = line.match(TokenDefinitions[part.token]);
		if (match) {
			return [{
				tokens: [{
					token: part.token,
					match: match
				}],
				line: line.replace(TokenDefinitions[part.token], '').trim()
			}];
		}

		return [];
	}

	if (part.empty) {
		return [{
			tokens: [],
			line: line
		}];
	}

	throw new Error(`Unknown part`);
}

module.exports = travelAst;
