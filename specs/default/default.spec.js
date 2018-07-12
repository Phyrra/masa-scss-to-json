const scssToJson = require('../../masa-scss-to-json');

describe('default', () => {
	it('should overwrite default', () => {
		expect(scssToJson('./specs/default', 'good-default').var).toEqual(2);
	});

	it('should fail for non-default overwrite', () => {
		expect(() => {
			scssToJson('./specs/default', 'bad-default');
		}).toThrow();
	});
});
