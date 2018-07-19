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

	it('should cut off block comment not starting the line', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'block-comment-following')).toEqual({
			a: 1,
			b: 2
		});
	});

	it('should cut out multiple comments', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'multiple-block-comments').border).toEqual('1px solid black');
	});

	it('should cut out comment after block comment', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'ending-comment-with-new-comment')).toEqual({
			a: 1,
			b: 2,
			c: 3
		});
	});

	it('should ignore one-line comments in a block comment', () => {
		expect(scssToJson('./specs/extract-variables/comments', 'line-comment-in-block-comment')).toEqual({
			var: 1
		});
	});
});
