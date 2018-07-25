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
				const results/*: IResult[]*/ = [];
				this._canMatchStatement(statement, 0, oneLine, [], results);
	
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
	
	_canMatchStatement(statement/*: Statement*/, i/*: number*/, line/*: string*/, tokens/*: IToken[]*/, results/*: IResult[]*/)/*: void*/ {
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
	
					return this._canMatchPart(option, line);
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
				.forEach(
					(partial/*: IResult*/) => this._canMatchStatement(statement, i + 1, partial.line, tokens.concat(partial.tokens), results)
				);
	
			return;
		}
	
		this._canMatchPart(part, line)
			.forEach((partial/*: IResult*/) => {
				if (part.canRepeat) {
					this._canMatchStatement(statement, i, partial.line, tokens.concat(partial.tokens), results);
				}
	
				this._canMatchStatement(statement, i + 1, partial.line, tokens.concat(partial.tokens), results)
			});
	}
	
	_canMatchPart(part/*: RuleNode */, line/*: string*/)/*: IResult[] */ {
		//console.log('matching', part, 'against', line);
	
		if (part.statement) {
			const nestedResults/*: IResult[]*/ = [];
			this._canMatchStatement(part.statement, 0, line, [], nestedResults);
	
			return nestedResults;
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