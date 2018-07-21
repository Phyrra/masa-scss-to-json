const scssToJson = require('../../masa-scss-to-json');

describe('calculations', () => {
	it('should resolve a variable with calculation', () => {
		expect(scssToJson('./specs/calculations', 'calculation-assignment')).toEqual({
			a: 3,
			b: '3px',
			c: '3px'
		});
	});

	it('should resolve variables in calculations', () => {
		expect(scssToJson('./specs/calculations', 'calculation-with-variable').b).toEqual('3px');
	});

	it('should resolve a calculation in an array', () => {
		expect(scssToJson('./specs/calculations', 'calculation-in-array').arr).toEqual([
			1,
			2,
			3
		]);
	});

	it('should resolve a calculation in a map', () => {
		expect(scssToJson('./specs/calculations', 'calculation-in-map').map).toEqual({
			a: 1,
			b: 2,
			c: 3
		});
	});
});
