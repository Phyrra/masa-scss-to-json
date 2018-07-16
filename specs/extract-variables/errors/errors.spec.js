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
			}).toThrowError(/^Could not match @import/);
		});

		it('should throw an error for missing semicolon', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'bad-import-missing-semicolon');
			}).toThrowError(/^Could not match @import/);
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
			}).toThrowError(/^Could not match \$var/);
		});

		it('should throw an error for missing semicolon', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'bad-variable-missing-semicolon');
			}).toThrowError(/^Could not match/);
		});

		it('should throw an error if something follows !default', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'bad-variable-important-after-default');
			}).toThrowError(/Could not match !important/);
		});

		// TODO: Not sure if this should throw or not..
		// The implementation is rather ugly
		it('should throw an error for an unterminated variable if it is the last statement', () => {
			expect(() => {
				scssToJson('./specs/extract-variables/errors', 'unterminated-variable');
			}).toThrowError('Unterminated statement');
		});
	});
});
