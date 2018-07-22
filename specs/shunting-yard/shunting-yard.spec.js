const shuntingYard = require('../../src/shunting-yard');

describe('shunting yard', () => {
	describe('no units', () => {
		it('should add numbers', () => {
			expect(shuntingYard([
				{ type: 'NUMBER', part: 1 },
				{  type: 'OPERATOR', part: '+' },
				{ type: 'NUMBER', part: 2 }
			]))
				.toEqual({
					type: 'NUMBER',
					part: 3,
					unit: undefined
				});
		});

		it('should subtract numbers', () => {
			expect(shuntingYard([
				{ type: 'NUMBER', part: 1 },
				{ type: 'OPERATOR', part: '-' },
				{ type: 'NUMBER', part: 2 }
			]))
				.toEqual({
					type: 'NUMBER',
					part: -1,
					unit: undefined
				});
		});

		it('should multiply numbers', () => {
			expect(shuntingYard([
				{ type: 'NUMBER', part: 2 },
				{ type: 'OPERATOR', part: '*' },
				{ type: 'NUMBER', part: 3 }
			]))
				.toEqual({
					type: 'NUMBER',
					part: 6,
					unit: undefined
				});
		});

		it('should divide numbers', () => {
			expect(shuntingYard([
				{ type: 'NUMBER', part: 6 },
				{ type: 'OPERATOR', part: '/' },
				{ type: 'NUMBER', part: 2 }
			]))
				.toEqual({
					type: 'NUMBER',
					part: 3,
					unit: undefined
				});
		});

		describe('pemdas', () => {
			it('should prioritize multiplication', () => {
				expect(shuntingYard([
					{ type: 'NUMBER', part: 1 },
					{ type: 'OPERATOR', part: '+' },
					{ type: 'NUMBER', part: 2 },
					{ type: 'OPERATOR', part: '*' },
					{ type: 'NUMBER', part: 3 }
				]))
					.toEqual({
						type: 'NUMBER',
						part: 7,
						unit: undefined
					});

				expect(shuntingYard([
					{ type: 'NUMBER', part: 3 },
					{ type: 'OPERATOR', part: '*' },
					{ type: 'NUMBER', part: 2 },
					{ type: 'OPERATOR', part: '+' },
					{ type: 'NUMBER', part: 1 }
				]))
					.toEqual({
						type: 'NUMBER',
						part: 7,
						unit: undefined
					});
			});

			it('should prioritize division', () => {
				expect(shuntingYard([
					{ type: 'NUMBER', part: 1 },
					{ type: 'OPERATOR', part: '-' },
					{ type: 'NUMBER', part: 6 },
					{ type: 'OPERATOR', part: '/' },
					{ type: 'NUMBER', part: 3 }
				]))
					.toEqual({
						type: 'NUMBER',
						part: -1,
						unit: undefined
					});

				expect(shuntingYard([
					{ type: 'NUMBER', part: 6 },
					{ type: 'OPERATOR', part: '/' },
					{ type: 'NUMBER', part: 3 },
					{ type: 'OPERATOR', part: '-' },
					{ type: 'NUMBER', part: 1 }
				]))
					.toEqual({
						type: 'NUMBER',
						part: 1,
						unit: undefined
					});
			});

			it('should resolve brackets', () => {
				expect(shuntingYard([
					{ type: 'NUMBER', part: 2 },
					{ type: 'OPERATOR', part: '*' },
					{ type: 'BRACKET_OPEN', part: '(' },
					{ type: 'NUMBER', part: 1 },
					{ type: 'OPERATOR', part: '+' },
					{ type: 'NUMBER', part: 3 },
					{  type: 'BRACKET_CLOSE', part: ')' }
				]))
					.toEqual({
						type: 'NUMBER',
						part: 8,
						unit: undefined
					});
			});
		});
	});

	describe('with units', () => {
		it('should add pixels', () => {
			expect(shuntingYard([
				{ type: 'NUMBER', part: 1, unit: 'px' },
				{ type: 'OPERATOR', part: '+' },
				{ type: 'NUMBER', part: 2, unit: 'px' }
			]))
				.toEqual({
					type: 'NUMBER',
					part: 3,
					unit: 'px'
				});
		});

		it('should subtract pixels', () => {
			expect(shuntingYard([
				{ type: 'NUMBER', part: 1, unit: 'px' },
				{ type: 'OPERATOR', part: '-' },
				{ type: 'NUMBER', part: 2, unit: 'px' }
			]))
				.toEqual({
					type: 'NUMBER',
					part: -1,
					unit: 'px'
				});
		});

		it('should multiply pixel with no-unit', () => {
			expect(shuntingYard([
				{ type: 'NUMBER', part: 1, unit: 'px' },
				{ type: 'OPERATOR', part: '*' },
				{ type: 'NUMBER', part: 2 }
			]))
				.toEqual({
					type: 'NUMBER',
					part: 2,
					unit: 'px'
				});

			expect(shuntingYard([
				{ type: 'NUMBER', part: 1 },
				{ type: 'OPERATOR', part: '*' },
				{ type: 'NUMBER', part: 2, unit: 'px' }
			]))
				.toEqual({
					type: 'NUMBER',
					part: 2,
					unit: 'px'
				});
		});

		it('should divide pixels', () => {
			expect(shuntingYard([
				{ type: 'NUMBER', part: 2, unit: 'px' },
				{ type: 'OPERATOR', part: '/' },
				{ type: 'NUMBER', part: 2 }
			]))
				.toEqual({
					type: 'NUMBER',
					part: 1,
					unit: 'px'
				});
		});

		describe('errors', () => {
			it('should throw an error when multiplying pixels', () => {
				expect(() => {
					shuntingYard([
						{ type: 'NUMBER', part: 1, unit: 'px' },
						{ type: 'OPERATOR', part: '*' },
						{ type: 'NUMBER', part: 2, unit: 'px' }
					])
				}).toThrowError('Cannot multiply px and px');
			});

			it('should throw an error when dividing by pixel', () => {
				expect(() => {
					shuntingYard([
						{ type: 'NUMBER', part: 6 },
						{ type: 'OPERATOR', part: '/' },
						{ type: 'NUMBER', part: 2, unit: 'px' }
					])
				}).toThrowError('Cannot divide by px');
			});

			it('should throw an error when adding different units', () => {
				expect(() => {
					shuntingYard([
						{ type: 'NUMBER', part: 1, unit: 'px' },
						{ type: 'OPERATOR', part: '+' },
						{ type: 'NUMBER', part: 2, unit: 'em' }
					])
				}).toThrowError('Cannot add em to px');
			});

			it('should throw an error when adding unit and no-unit', () => {
				expect(() => {
					shuntingYard([
						{ type: 'NUMBER', part: 1 },
						{ type: 'OPERATOR', part: '+' },
						{ type: 'NUMBER', part: 2, unit: 'px' }
					])
				}).toThrowError('Cannot add px to no-unit');

				expect(() => {
					shuntingYard([
						{ type: 'NUMBER', part: 1, unit: 'px' },
						{ type: 'OPERATOR', part: '+' },
						{ type: 'NUMBER', part: 2 }
					])
				}).toThrowError('Cannot add no-unit to px');
			});

			it('should throw an error when subtracting different units', () => {
				expect(() => {
					shuntingYard([
						{ type: 'NUMBER', part: 1, unit: 'px' },
						{ type: 'OPERATOR', part: '-' },
						{ type: 'NUMBER', part: 2, unit: 'em' }
					])
				}).toThrowError('Cannot subtract em from px');
			});

			it('should throw an error when subtracting unit and no-unit', () => {
				expect(() => {
					shuntingYard([
						{ type: 'NUMBER', part: 1 },
						{ type: 'OPERATOR', part: '-' },
						{ type: 'NUMBER', part: 2, unit: 'px' }
					])
				}).toThrowError('Cannot subtract px from no-unit');

				expect(() => {
					shuntingYard([
						{ type: 'NUMBER', part: 1, unit: 'px' },
						{ type: 'OPERATOR', part: '-' },
						{ type: 'NUMBER', part: 2 }
					])
				}).toThrowError('Cannot subtract no-unit from px');
			});
		});
	});
});
