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
		expect(testToCss('./specs/to-css/media-rules', 'nested-rules-in-media')).toEqual([
			'@media screen and (max-width: 900px) {',
			'\t.outer .inner {',
			'\t\tfont-size: 0.5em;',
			'\t}',
			'}'
		]);
	});

	it('should put multiplied rules within a media query', () => {
		expect(testToCss('./specs/to-css/media-rules', 'multi-selector-rule-in-media')).toEqual([
			'@media screen and (max-width: 900px) {',
			'\t.outer-1 .inner,',
			'\t.outer-2 .inner {',
			'\t\tfont-size: 0.5em;',
			'\t}',
			'}'
		]);
	});

	it('should handle a nested media query', () => {
		expect(testToCss('./specs/to-css/media-rules', 'media-rule-in-rule')).toEqual([
			'@media screen and (max-width: 900px) {',
			'\t.some-selector {',
			'\t\tfont-size: 0.5em;',
			'\t}',
			'}'
		]);
	});

	it('should collect multiple rules', () => {
		expect(testToCss('./specs/to-css/media-rules', 'multiple-rules-in-media')).toEqual([
			'@media screen and (max-width: 900px) {',
			'\t.some-selector {',
			'\t\tfont-size: 0.5em;',
			'\t}',
			'',
			'\t.other-selector {',
			'\t\tpadding: 0;',
			'\t}',
			'}'
		]);
	});

	it('should combine nested media rules', () => {
		expect(testToCss('./specs/to-css/media-rules', 'nested-media-rules')).toEqual([
			'@media screen and (max-width: 900px) and (min-width: 640px) {',
			'\t.outer .inner {',
			'\t\tpadding: 0;',
			'\t}',
			'}'
		]);
	});

	it('should paste properties directly into media rule if there is no parent', () => {
		expect(testToCss('./specs/to-css/media-rules', 'media-rule-with-property')).toEqual([
			'@media screen and (max-width: 900px) {',
			'\tfont-size: 0.5em;',
			'}'
		]);
	});

	it('should handle a print rule without conditions', () => {
		expect(testToCss('./specs/to-css/media-rules', 'media-rule-print')).toEqual([
			'@media print {',
			'\t* {',
			'\t\tborder: none;',
			'\t}',
			'}'
		]);
	});

	it('should throw an error when nesting a print rule within a screen rule', () => {
		expect(() => {
			testToCss('./specs/to-css/media-rules', 'bad-nested-media-rule');
		}).toThrowError(/Cannot combine media types .*screen.* and .*print.*/);
	});
});

