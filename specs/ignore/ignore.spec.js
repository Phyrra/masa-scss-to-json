const scssToJson = require('../../masa-scss-to-json');

describe('ignore', () => {
	it('should ignore rules', () => {
		expect(scssToJson('./specs/ignore', 'ignore'))
			.toEqual({
				['border-size']: '1px',
				['border-color']: 'black'
			});
	});
});