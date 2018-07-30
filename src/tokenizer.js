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
				const result/*: IResult*/ = this._canMatchStatement(statement, oneLine);

				if (result == null) {
					return false;
				}

				oneLine = result.line;
				tokens = tokens.concat(result.tokens);

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

	_canMatchStatement(statement/*: Statement*/, line/*: string*/)/*: IResult*/ {
		const results/*: IResult[]*/ = this._canMatchStatementStep(statement, 0, line, []);

		if (results.length === 0) {
			return null;
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

		return results[0];
	}

	_canMatchStatementStep(statement/*: Statement*/, i/*: number*/, line/*: string*/, tokens/*: IToken[]*/)/*: IResult[]*/ {
		if (i >= statement.length) {
			return [{
				line: line,
				tokens: tokens
			}];
		}

		const part/*: StatementNode | StatementNode[]*/ = statement[i];

		const filterIf = (arr, condition, filter) => {
			if (condition(arr)) {
				return arr.filter(filter);
			}

			return arr;
		}

		return filterIf(
			(Array.isArray(part) ? part : [part])
				.map((option/*: RuleNode*/) => {
					return {
						option: option,
						result: this._canMatchOption(option, line)
					};
				})
				.filter((path/*: IResult*/) => !!path.result),
			(paths) => paths.length > 1,
			(path) => !path.option.empty
		)
			.map(path => path.result)
			.map(path => this._canMatchStatementStep(statement, i + 1, path.line, tokens.concat(path.tokens)))
			.reduce((allPaths/*: IResult[]*/, partials/*: IResult[]*/) => allPaths.concat(partials), []);
	}

	_canMatchOption(option/*: RuleNode*/, line/*: string*/)/*: IResult*/ {
		const match/*: IResult*/ = this._canMatchPart(option, line);

		if (match) {
			if (option.canRepeat) {
				const repeatMatch/*: IResult*/ = this._canMatchOption(option, match.line);

				if (repeatMatch) {
					return Object.assign(repeatMatch, { tokens: match.tokens.concat(repeatMatch.tokens) });
				}
			}

			return match;
		}

		return null;
	}

	_canMatchPart(part/*: RuleNode*/, line/*: string*/)/*: IResult*/ {
		//console.log('matching', part, 'against', line);

		if (part.statement) {
			return this._canMatchStatement(part.statement, line);
		}

		if (part.token) {
			const match/* string[]*/ = line.match(this._tokenDefinitions[part.token]);
			if (match) {
				return {
					tokens: [{
						token: part.token,
						match: match
					}],
					line: line.replace(this._tokenDefinitions[part.token], '').trim()
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

		throw new Error(`Unknown part`);
	}
}

module.exports = (tokenDefinitions/*: TokenDefinitions*/, root/*: Statement[]*/, lines/*: string[]*/) =>
	new Tokenizer(tokenDefinitions).travelAst(root, lines);
