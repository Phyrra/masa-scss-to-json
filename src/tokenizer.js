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
				const results/*: IResult[]*/ = this._canMatchStatement(statement, oneLine);

				if (results.length === 0) {
					return false;
				}

				if (results.length > 1) {
					console.log(
						'FOUND_OPTIONS',
						results.map(
							result => result.tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']')
						)
					);

					throw new Error(`Multiple options found for ${line}`);
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

		//console.log(tokens.map(token => token.token + ' [' + token.match.slice(1).join(', ') + ']'));

		return tokens;
	}

	_canMatchStatement(statement/*: Statement*/, line/*: string*/)/*: IResult[]*/ {
		return this._canMatchStatementStep(statement, 0, line, []);
	}

	_canMatchStatementStep(statement/*: Statement*/, i/*: number*/, line/*: string*/, tokens/*: IToken[]*/)/*: IResult[]*/ {
		if (i >= statement.length) {
			return [{
				line: line,
				tokens: tokens
			}];
		}

		const filterIf = (arr, condition, filter) => {
			if (condition(arr)) {
				return arr.filter(filter);
			}

			return arr;
		};

		const part/*: StatementNode | StatementNode[]*/ = statement[i];

		return filterIf(
			(Array.isArray(part) ? part : [part])
				.map((option/*: RuleNode*/) => {
					return {
						option: option,
						paths: this._canMatchOption(option, line)
					};
				})
				.filter((partials/*: { RuleNode, IResult[] }*/ => partials.paths.length > 0)),
			(partials) => partials.length > 1,
			(partial) => !partial.option.empty
		)
			.map((partials/*: { RuleNode, IResult[] }*/) => partials.paths)
			.reduce((allResults/*: IResult[]*/, partials/*: IResult[]*/) => allResults.concat(partials), [])
			.map((path/*: IResult*/) => this._canMatchStatementStep(statement, i + 1, path.line, tokens.concat(path.tokens)))
			.reduce((allResults/*: IResult[]*/, partials/*: IResult[]*/) => allResults.concat(partials), []);
	}

	_canMatchOption(option/*: RuleNode*/, line/*: string*/)/*: IResult[]*/ {
		return this._canMatchPart(option, line)
			.map((partial/*: IResult*/) => {
				let results/*: IResult[]*/ = [ partial ];

				if (option.canRepeat) {
					results = results.concat(
						this._canMatchOption(option, partial.line)
							.map((repeat/*: IResult*/) => Object.assign(
								repeat,
								{ tokens: partial.tokens.concat(repeat.tokens) }
							))
					);
				}

				return results;
			})
			.reduce((allResults/*: IResult[]*/, partials/*: IResult[]*/) => allResults.concat(partials), []);
	}

	_canMatchPart(part/*: RuleNode*/, line/*: string*/)/*: IResult[]*/ {
		//console.log('matching', part, 'against', line);

		if (part.statement) {
			return this._canMatchStatement(part.statement, line);
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
