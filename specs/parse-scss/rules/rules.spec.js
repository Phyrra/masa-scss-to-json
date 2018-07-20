const rollup = require('../../../src/rollup');

describe('rules', () => {
	it('should read a single rule', () => {
		const json = rollup('./specs/parse-scss/rules', 'single-rule');

		expect(json.rules).toEqual(jasmine.any(Array));
		expect(json.rules.length).toBe(1);

		expect(json.rules[0].selector).toEqual('.some-selector');
	});

	it('should read multiple rules', () => {
		const json = rollup('./specs/parse-scss/rules', 'multiple-rules');

		expect(json.rules).toEqual(jasmine.any(Array));
		expect(json.rules.length).toBe(2);

		expect(json.rules[0].selector).toEqual('.some-selector');
		expect(json.rules[1].selector).toEqual('.some-other-selector');
	});

	it('should nest rules', () => {
		const json = rollup('./specs/parse-scss/rules', 'nested-rules');

		expect(json.rules[0].rules).toEqual(jasmine.any(Array));
		expect(json.rules[0].rules.length).toBe(1);
	});

	it('should nest multiple rules', () => {
		const json = rollup('./specs/parse-scss/rules', 'multiple-nested-rules');

		expect(json.rules[0].rules).toEqual(jasmine.any(Array));
		expect(json.rules[0].rules.length).toBe(2);
	});

	it('should map empty rules', () => {
		const json = rollup('./specs/parse-scss/rules', 'empty-rules');

		expect(json.rules).toEqual(jasmine.any(Array));
		expect(json.rules.length).toBe(2);
	});
});
