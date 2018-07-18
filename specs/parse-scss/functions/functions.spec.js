const rollup = require('../../../src/rollup');

describe('functions', () => {
	it('should interpret inbuilt functions', () => {
		const json = rollup('./specs/parse-scss/functions', 'inbuilt-function');

		// TODO: Step 2 is to actually execute the function
		expect(json.rules[0].properties[0]).toEqual(jasmine.objectContaining({
			value: 'lighten(red, 10%)'
		}));
	});

	it('should assign function result', () => {
		const json = rollup('./specs/parse-scss/functions', 'function-assignment');

		// TODO: Step 2 is to actually execute the function
		expect(json.variables).toEqual({
			'base-color': 'red',
			'lighter-color': 'lighten(red, 10%)'
		});
	})

	it('should interpret array accessor function', () => {
		const json = rollup('./specs/parse-scss/functions', 'array-function');

		expect(json.rules[0].properties[0]).toEqual(jasmine.objectContaining({
			value: 'red'
		}));
	});
});