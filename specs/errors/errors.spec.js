const scssToJson = require('../../masa-scss-to-json');

describe('errors', () => {
	describe('import', () => {
		it('should accept valid imports', () => {
			expect(() => {
				scssToJson('./specs/errors', 'good-imports');
			}).not.toThrow();
		});

		it('should throw an error for missing quotes', () => {
			expect(() => {
				scssToJson('./specs/errors', 'bad-import-missing-quotes');
			}).toThrowError(/^Bad import/);
		});

		it('should throw an error for missing semicolon', () => {
			expect(() => {
				scssToJson('./specs/errors', 'bad-import-missing-semicolon');
			}).toThrowError(/^Bad import/);
		});
	});

	describe('variables', () => {
		it('should accept valid variable declarations', () => {
			expect(() => {
				scssToJson('./specs/errors', 'good-variables');
			}).not.toThrow();
		});

		it('should throw an error for missing colon', () => {
			expect(() => {
				scssToJson('./specs/errors', 'bad-variable-missing-colon');
			}).toThrowError(/^Missing colon/);
		});

		it('should throw an error for missing semicolon', () => {
			expect(() => {
				scssToJson('./specs/errors', 'bad-variable-missing-semicolon');
			}).toThrowError(/^Missing semicolon/);
		});

		it('should throw an error if something follows !default', () => {
			expect(() => {
				scssToJson('./specs/errors', 'bad-variable-important-after-default');
			}).toThrowError('Unknown parameter after !default');
		});
	});
});
