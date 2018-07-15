const scssToJson = require('../../../masa-scss-to-json');

describe('basic', () => {
	it('should read variable', () => {
		expect(scssToJson('./specs/extract-variables/basic', 'one-var').var).toEqual(1);
	});

	it('should read multiple variables', () => {
		const json = scssToJson('./specs/extract-variables/basic', 'two-vars');

		expect(json.a).toEqual(1);
		expect(json.b).toEqual(2);
	});

	it('should throw an error if file does not exist', () => {
		expect(() => {
			scssToJson('./specs/extract-variables/basic', 'unknown');
		}).toThrowError(/^ENOENT/);
	});
});
