const rollup = require('../../../src/rollup');

describe('block calculations', () => {
	it('should handle block calculations', () => {
		const json = rollup('./specs/parse-scss/calculations', 'block-calculation');

		expect(json.rules[0].properties[0].value).toEqual('3 4');
	});

	it('should handle a single value in a calculation', () => {
		const json = rollup('./specs/parse-scss/calculations', 'single-value-calculation');

		expect(json.rules[0].properties[0].value).toEqual('1px');
	});

	it('should throw an error if an array variable is used in calculation', () => {
		expect(() => {
			rollup('./specs/parse-scss/calculations', 'array-variable-in-calculation');
		}).toThrowError('Non-value variable arr found in calculation');
	});

	it('should throw an error if a non-numeric variable is used in calculation', () => {
		expect(() => {
			rollup('./specs/parse-scss/calculations', 'non-numeric-variable-in-calculation');
		}).toThrowError('Bad variable value 1px solid black found in calculation')
	});

	it('should add a unit after the calculation', () => {
		const json = rollup('./specs/parse-scss/calculations', 'unit-after-calculation');

		expect(json.variables).toEqual({
			var: '3px'
		});
	});

	it('should throw an error when result has a unit and is followed by one', () => {
		expect(() => {
			const json = rollup('./specs/parse-scss/calculations', 'unit-after-calculation-with-unit');
		}).toThrowError('Cannot overwrite unit px with px');
	});
});

// TODO
xdescribe('inline calculaitons', () => {
	it('should handle inline calculations', () => {
		const json = rollup('./specs/parse-scss/calculations', 'inline-calcultation');

		expect(json.variables).toEqual({
			var: '2px'
		});
	});
})
