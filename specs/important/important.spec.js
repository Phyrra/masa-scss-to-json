const scssToJson = require('../../masa-scss-to-json');

describe('important', () => {
	it('should not put !important into the value', () => {
		expect(scssToJson('./specs/important', 'important').var).toEqual(1);
	});

	it('should work with !default', () => {
		expect(scssToJson('./specs/important', 'important-default').var).toEqual(2);
	});
});
