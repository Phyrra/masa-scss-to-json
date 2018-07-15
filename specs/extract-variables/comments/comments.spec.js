const scssToJson = require('../../../masa-scss-to-json');

describe('comments', () => {
	it('should ignore comment', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'one-line-comment').b).toEqual(2);
	});

	it('should ignore end-of-line comment', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'end-of-line-comment').var).toEqual(1);
	});

	it('should ignore comment block', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'comment-block').b).toEqual(2);
	});

	it('should ignore inline comment', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'inline-comment').var).toEqual(1);
	});

	it('should find variable following block comment', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'block-comment-follow').var).toEqual(1);
	});
});