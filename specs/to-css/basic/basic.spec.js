const toCss = require('../../../masa-scss-to-css');

function splitter(line) {
	return line.split('\r\n');
}

function testToCss(baseDir, file) {
	return splitter(
		toCss(baseDir, file)
	);
}

describe('basic', () => {
	it('should transform a rule', () => {
		expect(testToCss('./specs/to-css/basic', 'single-rule')).toEqual([
			'.some-selector {',
			'\tborder: 1px solid black;',
			'}'
		]);
	});

	it('should transform multiple rules', () => {
		expect(testToCss('./specs/to-css/basic', 'multiple-rules')).toEqual([
			'.some-selector-1 {',
			'\tborder: 1px solid red;',
			'}',
			'',
			'.some-selector-2 {',
			'\tborder: 1px solid green;',
			'}'
		]);
	});

	it('should transform nested rule', () => {
		expect(testToCss('./specs/to-css/basic', 'nested-rule')).toEqual([
			'.outer .inner {',
			'\tborder: 1px solid black;',
			'}'
		]);
	});

	it('should duplicate nested rule with multiple selectors', () => {
		expect(testToCss('./specs/to-css/basic', 'multiple-selectors-in-single-selector')).toEqual([
			'.outer .inner-1,',
			'.outer .inner-2 {',
			'\tborder: 1px solid black;',
			'}'
		]);
	});

	it('should duplicate rule nested in multiple selectors', () => {
		expect(testToCss('./specs/to-css/basic', 'single-selector-in-multiple-selectors')).toEqual([
			'.outer-1 .inner,',
			'.outer-2 .inner {',
			'\tborder: 1px solid black;',
			'}'
		]);
	});

	it('should multiply multiple selectors nested in multiple selectors', () => {
		expect(testToCss('./specs/to-css/basic', 'multiple-selectors-in-multiple-selectors')).toEqual([
			'.outer-1 .inner-1,',
			'.outer-1 .inner-2,',
			'.outer-2 .inner-1,',
			'.outer-2 .inner-2 {',
			'\tborder: 1px solid black;',
			'}'
		]);
	});
});

