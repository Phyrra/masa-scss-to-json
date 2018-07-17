const rollup = require('../../../src/rollup');

describe('errors', () => {
	it('should throw an error for mismatching closing braces', () => {
		expect(() => {
			rollup('./specs/parse-scss/errors', 'mismatched-rule-closing')
		}).toThrowError(/Could not match \}/);
	});
});
