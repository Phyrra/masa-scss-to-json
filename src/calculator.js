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
enum Token {
	NUMBER,
	OPERATOR,
	LEFT_BRACKET,
	RIGHT_BRACKET
}
*/
const Token = {
	NUMBER: 'NUMBER',
	OPERATOR: 'OPERATOR',
	LEFT_BRACKET: 'LEFT_BRACKET',
	RIGHT_BRACKET: 'RIGHT_BRACKET'
};

/*
interface INumber {
	value: number;
	unit?: string;
}
*/
function getNumber(token/*: string*/)/*: INumber*/ {
	const match/*: string[] | null*/ = token.match(/^([+-]?(\d*\.\d+|\d+\.\d*)|[+-]?\d+)([a-zA-Z%]+)?/);

	if (!match) {
		throw new Error(`Bad number format ${token}`);
	}

	return {
		value: Number(match[1]),
		unit: match[3]
	};
}

function unitToString(unit/*: string | undefined*/) {
	return unit ? unit : 'no-unit';
}

/*
interface IOperator {
	precedence: number;
	association: OperatorAssociation;
	calc: (number, number) => number
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
				value: Math.pow(left.value, right.value)
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
					value: left.value * right.value,
					unit: left.unit || right.unit
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
				value: left.value / right.value,
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
				value: left.value + right.value,
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
				value: left.value - right.value,
				unit: left.unit
			};
		}
    }
};

/*
interface IToken {
	value: string;
	type: Token;
}
*/

function tokenize(line/*: string*/)/*: IToken[]*/ {
    const tokens/*: IToken*/ = [];

	let lastCharType/*: Token*/ = null;
	let stack/*: string[]*/ = [];

	for (let i = 0; i < line.length; ++i) {
		const c/*: string*/ = line.charAt(i);

		if (c === ' ') {
			continue;
		}

		if (c === '(' || c === ')' || Operator[c]) {
			if (c === '-' || c === '+') {
				/*
				 * Prefix (-1 / +1)
				 * -1 + 2
				 * (-1) + 2
				 */
				if (!lastCharType || (lastCharType !== Token.NUMBER && lastCharType !== Token.RIGHT_BRACKET)) {
					stack.push(c);

					lastCharType = Token.NUMBER;
					continue;
				}
			}

			if (stack.length > 0) {
				tokens.push({
					value: stack.join(''),
					type: Token.NUMBER
				});

				stack = [];
			}

			if (c === '(' || c === ')') {
				tokens.push({
					value: c,
					type: c === '(' ? Token.LEFT_BRACKET : Token.RIGHT_BRACKET
				});

				lastCharType = c === '(' ? Token.LEFT_BRACKET : Token.RIGHT_BRACKET;
			} else {
				tokens.push({
					value: c,
					type: Token.OPERATOR
				});

				lastCharType = Token.OPERATOR;
			}
		} else {
			stack.push(c);

			lastCharType = Token.NUMBER;
		}
	}

	if (stack.length > 0) {
		tokens.push({
			value: stack.join(''),
			type: Token.NUMBER
		});
	}

    return tokens;
}

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

				return operators[op.value];
			}

			const currentOp/*: IOperator*/ = Operator[token.value];
			let opOnTop/*: IOperator*/ = peekOperator();

            while (opOnTop && (opOnTop.precedence > currentOp.precedence || (opOnTop.precedence === currentOp.precedence && opOnTop.association === OperatorAssociation.LEFT)) && (opOnTop.value !== '(')) {
				output.push(operators.pop());

				opOnTop = peekOperator();
            }

			operators.push(token);
        } else if (token.type === Token.LEFT_BRACKET) {
			operators.push(token);
		} else if (token.type === Token.RIGHT_BRACKET) {
			const getOperator = () => {
				const op/*: IToken*/ = operators.pop();

				if (!op) {
					throw new Error('Unbalanced brackets');
				}

				return op;
			}

			let opTokenOnTop/*: IToken*/ = getOperator();

			while (opTokenOnTop.type !== Token.LEFT_BRACKET) {
				output.push(opTokenOnTop);

				opTokenOnTop = getOperator();
			}
		}
    }

	for (let op/*: IToken*/ = operators.pop(); op; op = operators.pop()) {
		if (op.type === Token.LEFT_BRACKET) {
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
			stack.push(getNumber(token.value));
		} else if (token.type === Token.OPERATOR) {
			// 1 2 ^ -> 1 ^ 2
			// 1 5 - -> 1 - 5

			if (stack.legth < 2) {
				throw new Error('Unbalanced stack');
			}

			const right = stack.pop();
			const left = stack.pop();

			stack.push(
				Operator[token.value].calc(left, right)
			);
		} else {
			throw new Error(`Unexpeted Token: ${token.value}`);
		}
	});

	if (stack.length > 1) {
		throw new Error('Unbalanced stack');
	}

	const result/*: INumber*/ = stack[0];
	return result.value + (result.unit ? result.unit : '');
}

function calculate(line/*: string*/)/*: string*/ {
	const tokens/*: IToken*/ = tokenize(line);
	const shunted/*: IToken*/ = shuntingYard(tokens);
	const result/*: string*/ = reversePolish(shunted);

	return result;
}

module.exports = calculate;
