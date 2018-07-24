const toCss = require('../../../masa-scss-to-css');

function splitter(line) {
	return line.split('\r\n');
}

function testToCss(baseDir, file) {
	return splitter(
		toCss(baseDir, file)
	);
}

describe('media rules', () => {
	it('should place rule within a media query', () => {
		expect(testToCss('./specs/to-css/media-rules', 'media-rule-as-parent')).toEqual([
			'@media screen and (max-width: 900px) {',
			'\t.some-selector {',
			'\t\tfont-size: 0.5em;',
			'\t}',
			'}'
		]);
	});

	it('should put nested rules within a media query', () => {
		expect(testToCss('./specs/to-css/media-rules', 'media-rule-of-nested')).toEqual([
			'@media screen and (max-width: 900px) {',
			'\t.outer .inner {',
			'\t\tfont-size: 0.5em;',
			'\t}',
			'}'
		]);
	});

	it('should put multiplied rules within a media query', () => {
		expect(testToCss('./specs/to-css/media-rules', 'media-rule-of-multiple')).toEqual([
			'@media screen and (max-width: 900px) {',
			'\t.outer-1 .inner,',
			'\t.outer-2 .inner {',
			'\t\tfont-size: 0.5em;',
			'\t}',
			'}'
		]);
	});

	it('should throw an error for nested media queries', () => {
		expect(() => {
			testToCss('./specs/to-css/media-rules', 'nested-media-rule')
		}).toThrowError('Nested media queries are not supported');
	});
});

