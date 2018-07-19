const scssToJson = require('../../masa-scss-to-json');

describe('rules', () => {
	it('should ignore variables in a rule', () => {
		expect(scssToJson('./specs/rules', 'variable-in-rule')).toEqual({
			a: 1,
			c: 3
		});
	});

	it('should ignored variables in all nested rules', () => {
		expect(scssToJson('./specs/rules', 'nested-rules')).toEqual({
			a: 1,
			d: 4
		});
	});

	it('should ignore variables in a one-line-rule', () => {
		expect(scssToJson('./specs/rules', 'one-line-rule')).toEqual({
			a: 1,
			c: 3,
			//d: 4,
			f: 6
		});
	});

	it('should ignore brackets in rules', () => {
		expect(scssToJson('./specs/rules', 'bracket-in-rule')).toEqual({
			i: 1
		});
	});
});