const rollup = require('../../../src/rollup');

describe('rules', () => {
	it('should read single property', () => {
		const json = rollup('./specs/parse-scss/properties', 'single-property');

		expect(json.rules[0].properties).toEqual(jasmine.any(Array));
		expect(json.rules[0].properties.length).toBe(1);

		expect(json.rules[0].properties[0]).toEqual(jasmine.objectContaining({
			name: 'padding',
			value: '10px 5px'
		}));
	});

	it('should read multiple properties', () => {
		const json = rollup('./specs/parse-scss/properties', 'multiple-properties');

		expect(json.rules[0].properties).toEqual(jasmine.any(Array));
		expect(json.rules[0].properties.length).toBe(2);

		expect(json.rules[0].properties[0]).toEqual(jasmine.objectContaining({
			name: 'padding',
			value: '10px 5px'
		}));

		expect(json.rules[0].properties[1]).toEqual(jasmine.objectContaining({
			name: 'border',
			value: '1px solid black'
		}));
	});

	it('should read nested properties', () => {
		const json = rollup('./specs/parse-scss/properties', 'nested-properties');

		expect(json.rules[0].properties[0]).toEqual(jasmine.objectContaining({
			name: 'padding',
			value: '10px 5px'
		}));

		expect(json.rules[0].rules[0].properties[0]).toEqual(jasmine.objectContaining({
			name: 'border',
			value: '1px solid black'
		}));
	});

	it('should mark property as important', () => {
		const json = rollup('./specs/parse-scss/properties', 'important-property');

		expect(json.rules[0].properties[0]).toEqual(jasmine.objectContaining({
			important: true
		}));
	});
});
