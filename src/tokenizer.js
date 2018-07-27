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

class Tokenizer {
	constructor(tokenDefinitions/*: TokenDefinition*/) {
		this._tokenDefinitions = tokenDefinitions;
	}

	travelAst(root/*: Statement[]*/, lines/*: string[]*/)/*: IToken[] */ {
		// Screw whitespace, let's do it later
		let oneLine/*: string*/ = lines.join('\n').trim();

		let tokens/*: IToken[]*/ = [];

		while (oneLine.length > 0) {
			const found/*: boolean*/ = root.some((statement/*: Statement*/) => {
				const results/*: IResult[]*/ = this._canMatchStatement(statement, 0, oneLine, []);

				if (results.length === 0) {
					return false;
				}

				/*
				 * Edge case:
				 * Statement ends in [ { empty: true }, { token: Token } ]
				 * This will produce 2 possible paths,
				 * in this case take the longest one
				 */
				const longestMatch = results
					.reduce(
						(longest/*: IResult*/, match/*: IResult*/) => match.tokens.length > longest.tokens.length ? match : longest,
						{ tokens: [] }
					);

				oneLine = longestMatch.line;
				tokens = tokens.concat(longestMatch.tokens);

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

	_canMatchStatement(statement/*: Statement*/, i/*: number*/, line/*: string*/, tokens/*: IToken[]*/)/*: IResult[]*/ {
		if (i >= statement.length) {
			return [{
				line: line,
				tokens: tokens
			}];
		}

		const part/*: StatementNode | StatementNode[]*/ = statement[i];

		return (Array.isArray(part) ? part : [part])
			.map((option/*: RuleNode*/) => this._canMatchOption(option, line, tokens, statement, i))
			.reduce((allResults/*: IResult[]*/, partials/*: IResult[]*/) => allResults.concat(partials), []);
	}

	_canMatchOption(option/*: RuleNode*/, line/*: string*/, tokens/*: IToken[]*/, statement/*: Statement*/, i/*: number*/)/*: IResult[]*/ {
		return this._canMatchPart(option, line)
			.map((partial/*: IResult*/) => {
				let results/*: IResult[]*/ = [];

				if (option.canRepeat) {
					results = results.concat(
						this._canMatchOption(option, partial.line, tokens.concat(partial.tokens), statement, i)
					);
				}

				results = results.concat(
					this._canMatchStatement(statement, i + 1, partial.line, tokens.concat(partial.tokens))
				);

				return results;
			})
			.reduce((allResults/*: IResult[]*/, partials/*: IResult[]*/) => allResults.concat(partials), []);
	}

	_canMatchPart(part/*: RuleNode*/, line/*: string*/)/*: IResult[]*/ {
		//console.log('matching', part, 'against', line);

		if (part.statement) {
			return this._canMatchStatement(part.statement, 0, line, []);
		}

		if (part.token) {
			const match/* string[]*/ = line.match(this._tokenDefinitions[part.token]);
			if (match) {
				return [{
					tokens: [{
						token: part.token,
						match: match
					}],
					line: line.replace(this._tokenDefinitions[part.token], '').trim()
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
}

module.exports = (tokenDefinitions/*: TokenDefinitions*/, root/*: Statement[]*/, lines/*: string[]*/) =>
	new Tokenizer(tokenDefinitions).travelAst(root, lines);
