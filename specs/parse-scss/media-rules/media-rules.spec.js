const rollup = require('../../../src/rollup');

describe('media rules', () => {
	it('should read a media rule', () => {
		const json = rollup('./specs/parse-scss/media-rules', 'media-rule');

		expect(json.rules).toEqual(jasmine.any(Array));
		expect(json.rules.length).toBe(1);

		expect(json.rules[0]).toEqual(jasmine.objectContaining({
			media: true,
			mediaType: {
				modifier: null,
				type: 'screen'
			},
			mediaConditions: [{
				modifier: 'and',
				property: 'max-width',
				value: '900px'
			}]
		}));

		expect(json.rules[0].rules).toEqual(jasmine.any(Array));
		expect(json.rules[0].rules.length).toBe(1);

		expect(json.rules[0].rules[0].selector).toEqual('.some-selector');
	});

	it('should read a media rule with a modifier', () => {
		const json = rollup('./specs/parse-scss/media-rules', 'media-rule-with-modifier');

		expect(json.rules[0]).toEqual(jasmine.objectContaining({
			media: true,
			mediaType: {
				modifier: 'only',
				type: 'screen'
			}
		}));
	});

	it('should read a media rule within a block', () => {
		const json = rollup('./specs/parse-scss/media-rules', 'nested-media-rule');

		expect(json.rules[0].rules).toEqual(jasmine.any(Array));
		expect(json.rules[0].rules.length).toBe(1);

		expect(json.rules[0].rules[0]).toEqual(jasmine.objectContaining({
			media: true
		}));
	});

	it('should read an empty media rule', () => {
		const json = rollup('./specs/parse-scss/media-rules', 'empty-media-rule');

		expect(json.rules).toEqual(jasmine.any(Array));
		expect(json.rules.length).toBe(1);

		expect(json.rules[0]).toEqual(jasmine.objectContaining({
			media: true
		}));
	});

	it('should read a media rule with multiple conditions', () => {
		const json = rollup('./specs/parse-scss/media-rules', 'media-rule-with-multiple-conditions');

		expect(json.rules[0].mediaConditions).toEqual(jasmine.any(Array));
		expect(json.rules[0].mediaConditions.length).toBe(2);

		expect(json.rules[0].mediaConditions[0]).toEqual({
			modifier: 'and',
			property: 'max-width',
			value: '900px'
		});

		expect(json.rules[0].mediaConditions[1]).toEqual({
			modifier: 'and',
			property: 'min-width',
			value: '100px'
		});
	});

	it('should resolve variables in media conditions', () => {
		const json = rollup('./specs/parse-scss/media-rules', 'media-rule-with-variable-condition');

		expect(json.rules[0].mediaConditions[0]).toEqual({
			modifier: 'and',
			property: 'max-width',
			value: '900px'
		});
	});

	it('should resolve calculations in media conditions', () => {
		const json = rollup('./specs/parse-scss/media-rules', 'media-rule-with-calculation-condition');

		expect(json.rules[0].mediaConditions[0]).toEqual({
			modifier: 'and',
			property: 'max-width',
			value: '1800px'
		});
	});
});
