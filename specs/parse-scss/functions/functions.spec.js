const rollup = require('../../../src/rollup');

describe('functions', () => {
	describe('arguments', () => {
		it('should resolve a function without arguments', () => {
			const json = rollup('./specs/parse-scss/functions', 'no-argument-function');

			expect(json.variables).toEqual({
				var: 'foo()'
			});
		});

		it('should resolve a function with one argument', () => {
			const json = rollup('./specs/parse-scss/functions', 'one-argument-functions');

			expect(json.variables).toEqual({
				a: 'foo(1)',
				b: 'foo(black)',
				c: 'foo(#fff)',
				d: 'foo(foo(1))',
				e: 'foo(2)'
			});
		});

		it('should resolve a function with multiple arguments', () => {
			const json = rollup('./specs/parse-scss/functions', 'multi-argument-function');

			expect(json.variables).toEqual({
				border: 'get-border(1px, solid, black)'
			});
		});

		it('should resolve variables in function arguments', () => {
			const json = rollup('./specs/parse-scss/functions', 'variable-as-function-argument');

			expect(json.variables).toEqual(jasmine.objectContaining({
				border: 'get-border(1px, solid, black)'
			}));
		});

		it('should handle nested functions as arguments', () => {
			const json = rollup('./specs/parse-scss/functions', 'function-as-function-argument');

			expect(json.variables).toEqual({
				a: 'foo(bar(1))',
				b: 'foo(bar(baz(a), b), c)'
			});
		});
	});

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

	it('should resolve array accessor function', () => {
		const json = rollup('./specs/parse-scss/functions', 'array-function');

		expect(json.rules[0].properties[0]).toEqual(jasmine.objectContaining({
			value: 'red'
		}));

		expect(json.rules[0].properties[1]).toEqual(jasmine.objectContaining({
			value: 'green'
		}));
	});
});
