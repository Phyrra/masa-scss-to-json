const scssToJson = require('../../../masa-scss-to-json');

describe('global', () => {
	it('should not break on a global variable', () => {
		expect(scssToJson('./specs/extract-variables/global', 'global-in-root').var).toEqual(1);
	});

	it('should push a global variable to the global scope', () => {
		expect(scssToJson('./specs/extract-variables/global', 'global-in-rule')).toEqual({
			a: 1,
			b: 2
		});
	});

	it('should throw an error if a global variable already exists', () => {
		expect(() => {
			scssToJson('./specs/extract-variables/global', 'global-collide');
		}).toThrowError('Variable var already exists, cannot overwrite with "!global"');
	});
});
