const calculator = require('../../src/calculator');

describe('calculator', () => {
	describe('no units', () => {
		it('should add numbers', () => {
			expect(calculator('1 + 2')).toEqual('3');
		});

		it('should subtract numbers',() => {
			expect(calculator('1 - 2')).toEqual('-1');
		});

		it('should multiply numbers', () => {
			expect(calculator('2 * 3')).toEqual('6');
		});

		it('should divide numbers', () => {
			expect(calculator('6 / 3')).toEqual('2');
		});

		describe('pemdas', () => {
			it('should prioritize multiplication', () => {
				expect(calculator('1 + 2 * 3')).toEqual('7');
			});

			it('should prioritize division', () => {
				expect(calculator('1 - 6 / 3')).toEqual('-1');
			});

			it('should resolve brackets', () => {
				expect(calculator('2 * (1 + 3)')).toEqual('8');
			});
		});

		describe('negative numbers', () => {
			it('should find leading negative number', () => {
				expect(calculator('-1 + 2')).toEqual('1');
			});

			it('should not find negative number after bracket', () => {
				expect(calculator('(1 + 2) - 3')).toEqual('0');
			});

			it('should find negative number after operator', () => {
				expect(calculator('1 + -2')).toEqual('-1');
			});

			it('should find negative number in bracket', () => {
				expect(calculator('(-1) + 2')).toEqual('1');
			});
		});
	});

	describe('with units', () => {
		it('should add pixels', () => {
			expect(calculator('1px + 2px')).toEqual('3px');
		});

		it('should subtract pixels', () => {
			expect(calculator('1px - 2px')).toEqual('-1px');
		});

		it('should mutliple pixel with no-unit', () => {
			expect(calculator('1px * 2')).toEqual('2px');
			expect(calculator('1 * 2px')).toEqual('2px');
		});

		it('should divide pixels', () => {
			expect(calculator('2px / 2')).toEqual('1px');
		});

		describe('errors', () => {
			it('should throw an error when multiplying pixels', () => {
				expect(() => calculator('1px * 2px')).toThrowError('Cannot multiply px and px');
			});

			it('should throw an error when dividing by pixel', () => {
				expect(() => calculator('6 / 2px')).toThrowError('Cannot divide by px');
			});

			it('should throw an error when adding different units', () => {
				expect(() => calculator('1px + 2em')).toThrowError('Cannot add em to px');
			});

			it('should throw an error when adding unit and no-unit', () => {
				expect(() => calculator('1 + 2px')).toThrowError('Cannot add px to no-unit');
				expect(() => calculator('1px + 2')).toThrowError('Cannot add no-unit to px');
			});

			it('should throw an error when subtracting different units', () => {
				expect(() => calculator('1px - 2em')).toThrowError('Cannot subtract em from px');
			});

			it('should throw an error when subtracting unit and no-unit', () => {
				expect(() => calculator('1 - 2px')).toThrowError('Cannot subtract px from no-unit');
				expect(() => calculator('1px - 2')).toThrowError('Cannot subtract no-unit from px');
			});
		});
	});
});
