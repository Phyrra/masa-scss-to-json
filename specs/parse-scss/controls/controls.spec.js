const rollup = require('../../../src/rollup');

describe('controls', () => {
	it('should deal with @for', () => {
		const json = rollup('./specs/parse-scss/controls', 'for');

		// TODO
	});

	it('should deal with @if', () => {
		const json = rollup('./specs/parse-scss/controls', 'if');

		// TODO
	});

	it('should deal with @mixin', () => {
		const json = rollup('./specs/parse-scss/controls', 'mixin');

		// TODO
	});
});