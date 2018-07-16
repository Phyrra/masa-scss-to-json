const rollup = require('../../../src/rollup');

describe('imports', () => {
	describe('from root', () => {
		let json;

		beforeAll(() => {
			json = rollup('./specs/parse-scss/imports', 'import-from-root');
		});

		it('should rollup the rules', () => {
			expect(json.rules).toEqual(jasmine.any(Array));
			expect(json.rules.length).toBe(2);

			expect(json.rules[0].selector).toEqual('.some-other-selector');
			expect(json.rules[1].selector).toEqual('.some-selector');
		});

		it('should rollup the variables', () => {
			expect(json.variables).toEqual({
				'border-size': '2px',
				'border-color': 'black'
			});
		});

		it('should replace variable with non-default value', () => {
			expect(json.rules[1].properties[0]).toEqual(jasmine.objectContaining({
				name: 'border',
				value: '2px solid black'
			}));
		});
	});

	describe('from block', () => {
		let json;

		beforeAll(() => {
			json = rollup('./specs/parse-scss/imports', 'import-in-block');
		});

		it('should not add the rule to root', () => {
			expect(json.rules).toEqual(jasmine.any(Array));
			expect(json.rules.length).toBe(1);

			expect(json.rules[0].selector).toEqual('.some-selector');
		});

		it('should add the imported rule to the parent rule', () => {
			expect(json.rules[0].rules).toEqual(jasmine.any(Array));
			expect(json.rules[0].rules.length).toBe(1);

			expect(json.rules[0].rules[0].selector).toEqual('.some-other-selector');
		});

		it('should not add the variable into the scope of the root', () => {
			expect(json.variables).toEqual({});
		});

		it('should add the variable into the scope of the parent rule', () => {
			expect(json.rules[0].variables).toEqual({
				'border-size': '2px'
			});
		});
	});

	describe('variable cannot overwrite default from parent', () => {
		it('should throw an error', () => {
			expect(() => {
				rollup('./specs/parse-scss/imports', 'import-in-block-default-error');
			}).toThrowError('Variable border-size already exists in parent scope');
		})
	});
});
