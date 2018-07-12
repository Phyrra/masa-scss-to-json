const scssToJson = require('../../masa-scss-to-json');

describe('imports', () => {
	it('should import a file on the same level', () => {
		expect(scssToJson('./specs/imports', 'local-import').var).toEqual(1);
	});

	it('should import with single quotes', () => {
		expect(scssToJson('./specs/imports', 'import-single-quote').var).toEqual(1);
	});

	it('should import with whitespace', () => {
		expect(scssToJson('./specs/imports', 'import-whitespace').var).toEqual(1);
	});

	it('should import a file one level lower', () => {
		expect(scssToJson('./specs/imports/level', 'relative-path-import').var).toEqual(1);
	});

	it('should import a file from base', () => {
		expect(scssToJson('./', 'specs/imports/base-import').var).toEqual(1);
	});

	it('should throw an error for an unknown import', () => {
		expect(() => {
			scssToJson('./specs/imports', 'bad-import');
		}).toThrow();
	});
});
