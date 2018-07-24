const scssToJson = require('../../../masa-scss-to-json');

describe('values', () => {
	describe('strings', () => {
		let json;

		beforeAll(() => {
			json = scssToJson('./specs/extract-variables/values', 'strings');
		});

		it('should interpret single quote string', () => {
			expect(json.singleQuoteString).toEqual('asdf');
		});

		it('should interpret double quoted string', () => {
			expect(json.doubleQuoteString).toEqual('asdf');
		});
	});

	describe('integers', () => {
		let json;

		beforeAll(() => {
			json = scssToJson('./specs/extract-variables/values', 'integers');
		});

		it('should interpret normal integer', () => {
			expect(json.integer).toEqual(123);
		});

		it('should interpret positive integer', () => {
			expect(json.positiveInteger).toEqual(123);
		});

		it('should interpret negative integer', () => {
			expect(json.negativeInteger).toEqual(-123);
		});
	});

	describe('floats', () => {
		let json;

		beforeAll(() => {
			json = scssToJson('./specs/extract-variables/values', 'floats');
		});

		it('should interpret floats', () => {
			expect(json.float).toEqual(1.23);
		});

		it('should interpret positive float', () => {
			expect(json.positiveFloat).toEqual(1.23);
		});

		it('should interpret negative float', () => {
			expect(json.negativeFloat).toEqual(-1.23);
		});

		it('should interpret float without leading numbers', () => {
			expect(json.noLeadingFloat).toEqual(.123);
		});

		it('should interpret positive float without leading numbers', () => {
			expect(json.positiveNoLeadingFloat).toEqual(.123);
		});

		it('should interpret negative float without leading numbers', () => {
			expect(json.negativeNoLeadingFloat).toEqual(-.123);
		});

		it('should interpret float without tailing numbers', () => {
			expect(json.noTrailingFloat).toEqual(123.);
		});

		it('should interpret positive float without trailing numbers', () => {
			expect(json.positiveNoTrailingFloat).toEqual(123.);
		});

		it('should interpret negative float without trailing numbers', () => {
			expect(json.negativeNoTrailingFloat).toEqual(-123.);
		});
	});

	describe('others', () => {
		let json;

		beforeAll(() => {
			json = scssToJson('./specs/extract-variables/values', 'others');
		});

		it('should interpret pixel values', () => {
			expect(json.pixelValue).toEqual('40px');
		});

		it('should interpret multi parted values', () => {
			expect(json.multipartValue).toEqual('1px solid black');
		});

		it('should understand % as non-text unit', () => {
			expect(json.width).toEqual('50%');
		});
	});
});
