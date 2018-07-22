const rollup = require('../../../src/rollup');

describe('variables', () => {
	it('should correctly replace variable values', () => {
		const json = rollup('./specs/parse-scss/variables', 'rollup-variable');

		expect(json.variables).toEqual({
			a: 1,
			b: 1,
			c: 1
		});
	});

	it('should resolve variables in values', () => {
		const json = rollup('./specs/parse-scss/variables', 'resolve-values');

		expect(json.rules[0].properties[0].value).toEqual('1px solid black');
	});

	it('should scope variables correctly', () => {
		const json = rollup('./specs/parse-scss/variables', 'variable-scope');

		expect(json.variables).toEqual({
			'border-size': '1px'
		});

		expect(json.rules[0].variables).toEqual({
			'border': '1px solid black'
		});

		expect(json.rules[0].rules[0].properties[0].value).toEqual('1px solid black');
	});

	// TODO
	xit('should handle inline calculations', () => {
		const json = rollup('./specs/parse-scss/variables', 'calculations');

		expect(json.rules[0].properties[1].value).toEqual(2);
	});

	describe('block calculations', () => {
		it('should handle block calculations', () => {
			const json = rollup('./specs/parse-scss/variables', 'block-calculation');

			expect(json.rules[0].properties[0].value).toEqual('3 4');
		});

		it('should handle a single value in a calculation', () => {
			const json = rollup('./specs/parse-scss/variables', 'single-value-calculation');

			expect(json.rules[0].properties[0].value).toEqual('1px');
		});

		it('should throw an error if an array variable is used in calculation', () => {
			expect(() => {
				rollup('./specs/parse-scss/variables', 'array-variable-in-calculation');
			}).toThrowError('Non-value variable arr found in calculation');
		});

		it('should throw an error if a non-numeric variable is used in calculation', () => {
			expect(() => {
				rollup('./specs/parse-scss/variables', 'non-numeric-variable-in-calculation');
			}).toThrowError('Bad variable value 1px solid black found in calculation')
		});
	});
});
