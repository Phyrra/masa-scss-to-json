/*
enum OperatorAssociation = {
	LEFT,
	RIGHT
}
*/
const OperatorAssociation = {
	LEFT: 'LEFT',
	RIGHT: 'RIGHT'
};

/*
enum Token { // Must match scss-variable tokens
	VARIABLE,
	NUMBER,
	OPERATOR,
	BRACKET_OPEN,
	BRACKET_CLOSE
}

interface IToken {
	type: Token;
	part: number | string;
	unit?: string;
}
*/
const Token = {
	VARIABLE: 'VARIABLE',
	NUMBER: 'NUMBER',
	OPERATOR: 'OPERATOR',
	BRACKET_OPEN: 'BRACKET_OPEN',
	BRACKET_CLOSE: 'BRACKET_CLOSE'
};

function unitToString(unit/*: string | undefined*/)/*: string*/ {
	return unit ? unit : 'no-unit';
}

/*
interface IOperator {
	precedence: IToken;
	association: OperatorAssociation;
	calc: (IToken, IToken) => IToken
}
*/
const Operator/*: (key: string) => IOperator*/ = {
	'^': {
		precedence: 4,
		association: OperatorAssociation.RIGHT,
		calc: (left, right) => {
			if (left.unit || right.unit) {
				throw new Error(`Cannot power units`);
			}

			return {
				type: Token.NUMBER,
				value: Math.pow(left.part, right.part)
			};
		}
	},
	'*': {
		precedence: 3,
		association: OperatorAssociation.LEFT,
		calc: (left, right) => {
			if (
				(!left.unit && !right.unit) ||
				(left.unit && !right.unit) ||
				(!left.unit && right.unit)
			) {
				return {
					type: Token.NUMBER,
					part: left.part * right.part,
					unit: left.unit || right.unit
				};
			}

			throw new Error(`Cannot multiply ${unitToString(left.unit)} and ${unitToString(right.unit)}`);
		}
	},
	'/': {
		precedence: 3,
		association: OperatorAssociation.LEFT,
		calc: (left, right) => {
			if (right.unit) {
				throw new Error(`Cannot divide by ${unitToString(right.unit)}`);
			}

			return {
				type: Token.NUMBER,
				part: left.part / right.part,
				unit: left.unit
			};
		}
	},
	'+': {
		precedence: 2,
		association: OperatorAssociation.LEFT,
		calc: (left, right) => {
			if (left.unit !== right.unit) {
				throw new Error(`Cannot add ${unitToString(right.unit)} to ${unitToString(left.unit)}`);
			}

			return {
				type: Token.NUMBER,
				part: left.part + right.part,
				unit: left.unit
			};
		}
	},
	'-': {
		precedence: 2,
		association: OperatorAssociation.LEFT,
		calc: (left, right) => {
			if (left.unit !== right.unit) {
				throw new Error(`Cannot subtract ${unitToString(right.unit)} from ${unitToString(left.unit)}`);
			}

			return {
				type: Token.NUMBER,
				part: left.part - right.part,
				unit: left.unit
			};
		}
	}
};

function shuntingYard(tokens/*: IToken[]*/)/*: IToken[]*/ {
	const output/*: IToken*/ = [];
	const operators/*: IToken[]*/ = [];

	while (tokens.length > 0) {
		const token/*: IToken*/ = tokens.shift();

		if (token.type === Token.NUMBER) {
			output.push(token);
		} else if (token.type === Token.OPERATOR) {
			const peekOperator = () => {
				if (operators.length === 0) {
					return null;
				}

				const op/*: IToken*/ = operators[operators.length - 1];

				return Operator[op.part];
			}

			const currentOp/*: IOperator*/ = Operator[token.part];
			let opOnTop/*: IOperator*/ = peekOperator();

			while (opOnTop && (opOnTop.precedence > currentOp.precedence || (opOnTop.precedence === currentOp.precedence && opOnTop.association === OperatorAssociation.LEFT)) && (opOnTop.part !== '(')) {
				output.push(operators.pop());

				opOnTop = peekOperator();
			}

			operators.push(token);
		} else if (token.type === Token.BRACKET_OPEN) {
			operators.push(token);
		} else if (token.type === Token.BRACKET_CLOSE) {
			const getOperator = () => {
				const op/*: IToken*/ = operators.pop();

				if (!op) {
					throw new Error('Unbalanced brackets');
				}

				return op;
			}

			let opTokenOnTop/*: IToken*/ = getOperator();

			while (opTokenOnTop.type !== Token.BRACKET_OPEN) {
				output.push(opTokenOnTop);

				opTokenOnTop = getOperator();
			}
		}
	}

	for (let op/*: IToken*/ = operators.pop(); op; op = operators.pop()) {
		if (op.type === Token.BRACKET_OPEN) {
			throw new Error('Unbalanced brackets');
		}

		output.push(op);
	}

	return output;
}

function reversePolish(tokens/*: IToken[]*/)/*: string*/ {
	const stack/*: number[]*/ = [];

	tokens.forEach(token => {
		if (token.type === Token.NUMBER) {
			stack.push(token);
		} else if (token.type === Token.OPERATOR) {
			// 1 2 ^ -> 1 ^ 2
			// 1 5 - -> 1 - 5

			if (stack.legth < 2) {
				throw new Error('Unbalanced stack');
			}

			const right = stack.pop();
			const left = stack.pop();

			stack.push(
				Operator[token.part].calc(left, right)
			);
		} else {
			throw new Error(`Unexpeted Token: ${token.part}`);
		}
	});

	if (stack.length > 1) {
		throw new Error('Unbalanced stack');
	}

	return stack[0];
}

function calculate(tokens/*: IToken[]*/)/*: IToken*/ {
	const shunted/*: IToken[]*/ = shuntingYard(tokens);
	const result/*: IToken*/ = reversePolish(shunted);

	return result;
}

module.exports = calculate;
