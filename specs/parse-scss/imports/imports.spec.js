const rollup = require('../../../src/rollup');

describe('imports', () => {
	let json;

	beforeAll(() => {
		json = rollup('./specs/parse-scss/imports', 'base');
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