const scssToJson = require('../../../masa-scss-to-json');

describe('arrays', () => {
	it('should read a well formatted array', () => {
		expect(scssToJson('./specs/extract-variables/arrays', 'multi-line-array').arr).toEqual([
			1, 2, 3
		]);
	});

	it('should read a one line array', () => {
		expect(scssToJson('./specs/extract-variables/arrays', 'one-line-array').arr).toEqual([
			1, 2, 3
		]);
	});

	it('should read array with default', () => {
		const json = scssToJson('./specs/extract-variables/arrays', 'default-array');

		expect(json.arr1).toEqual([
			4, 5, 6
		]);

		expect(json.arr2).toEqual([
			7, 8, 9
		]);
	});

	it('should resolve variables in array', () => {
		expect(scssToJson('./specs/extract-variables/arrays', 'array-with-variables').arr).toEqual([
			1, 2, 3
		]);
	});

	it('should throw an error if variable cannot be resolved', () => {
		expect(() => {
			scssToJson('./specs/extract-variables/arrays', 'array-with-unknown-variable');
		}).toThrowError(/^Unknown variable/);
	});

	describe('different formats', () => {
		let json;

		beforeAll(() => {
			json = scssToJson('./specs/extract-variables/arrays', 'weird-format-arrays');
		});

		it('should catch elements that are on same line as start or stop', () => {
			expect(json.arr1).toEqual([
				1, 2, 3
			]);
		});

		it('should catch multiple elements on one row', () => {
			expect(json.arr2).toEqual([
				4, 5, 6
			]);
		});

		it('should deal with leading commas', () => {
			expect(json.arr3).toEqual([
				7, 8, 9
			]);
		});

		it('should catch elements on start or stop line with leading commas', () => {
			expect(json.arr4).toEqual([
				10, 11, 12
			]);
		});
	});
});