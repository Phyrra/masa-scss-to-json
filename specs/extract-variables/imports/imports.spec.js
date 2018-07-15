const scssToJson = require('../../../masa-scss-to-json');

describe('imports', () => {
	it('should import a file on the same level', () => {
		expect(scssToJson('./specs/extract-variables/imports', 'local-import').var).toEqual(1);
	});

	it('should import with single quotes', () => {
		expect(scssToJson('./specs/extract-variables/imports', 'import-single-quote').var).toEqual(1);
	});

	it('should import with whitespace', () => {
		expect(scssToJson('./specs/extract-variables/imports', 'import-whitespace').var).toEqual(1);
	});

	it('should import a file one level lower', () => {
		expect(scssToJson('./specs/extract-variables/imports/level', 'relative-path-import').var).toEqual(1);
	});

	it('should import a file from base', () => {
		expect(scssToJson('./specs', 'extract-variables/imports/base-import').var).toEqual(1);
	});

	it('should throw an error for an unknown import', () => {
		expect(() => {
			scssToJson('./specs/extract-variables/imports', 'bad-import');
		}).toThrowError(/^ENOENT/);
	});
});
