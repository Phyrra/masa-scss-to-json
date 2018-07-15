const scssToJson = require('../../../masa-scss-to-json');

describe('errors', () => {
	describe('import', () => {
		it('should accept valid imports', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'good-imports');
			}).not.toThrow();
		});

		it('should throw an error for missing quotes', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'bad-import-missing-quotes');
			}).toThrowError(/^Could not match line #1/);
		});

		it('should throw an error for missing semicolon', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'bad-import-missing-semicolon');
			}).toThrowError(/^Could not match line #1/);
		});
	});

	describe('variables', () => {
		it('should accept valid variable declarations', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'good-variables');
			}).not.toThrow();
		});

		it('should throw an error for missing colon', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'bad-variable-missing-colon');
			}).toThrowError(/^Could not match line #1/);
		});

		it('should throw an error for missing semicolon', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'bad-variable-missing-semicolon');
			}).toThrowError(/^Could not match line #1/);
		});

		it('should throw an error if something follows !default', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'bad-variable-important-after-default');
			}).toThrowError('Unknown parameter after !default');
		});
	});
});
