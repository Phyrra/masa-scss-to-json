const scssToJson = require('../../../masa-scss-to-json');

describe('maps', () => {
	it('should read a single element map', () => {
		expect(scssToJson('./specs/extract-variables/maps', 'one-element-map').map).toEqual({
			green: '#00ff00'
		});
	});

	it('should understand a map', () => {
		expect(scssToJson('./specs/extract-variables/maps', 'map').breakpoints).toEqual({
			small: '767px',
			medium: '992px',
			large: '1200px'
		});
	});

	it('should throw an error when mixing plain values into a map', () => {
		expect(() => {
			scssToJson('./specs/extract-variables/maps', 'map-array-mix');
		}).toThrowError(/^Could not match/);
	});

	it('should resolve variables in values', () => {
		expect(scssToJson('./specs/extract-variables/maps', 'map-with-variable-values').map).toEqual({
			black: '1px solid black',
			red: '1px solid red'
		});
	});

	it('should throw an error for unknown variables', () => {
		expect(() => {
			scssToJson('./specs/extract-variables/maps', 'map-with-unknown-variable');
		}).toThrowError('Unknown variable b');
	});
});
