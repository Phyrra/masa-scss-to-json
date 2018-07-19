const scssToJson = require('../../masa-scss-to-json');

describe('variables', () => {
	it('should replace a variable in another variable', () => {
		expect(scssToJson('./specs/variables', 'variable-in-variable')).toEqual({
			'border-size': '1px',
			'border': '1px solid black'
		});
	});

	it('should replace variables in a chain', () => {
		expect(scssToJson('./specs/variables', 'variable-chain')).toEqual({
			a: 1,
			b: 1,
			c: 1
		});
	});

	it('should replace variables in an array', () => {
		expect(scssToJson('./specs/variables', 'variable-in-array').borders).toEqual([
			'1px solid red',
			'1px solid green',
			'1px solid blue'
		]);
	});

	it('should throw an error for an unknown variable', () => {
		expect(() => {
			scssToJson('./specs/variables', 'unknown-variable');
		}).toThrowError('Unknown variable b');
	});

	it('should get all declarations on one line', () => {
		expect(scssToJson('./specs/variables', 'multiple-declarations')).toEqual({
			a: 1,
			b: 2
		});
	});
});
