const rollup = require('../../../src/rollup');

xdescribe('controls', () => {
	it('should deal with @for', () => {
		// TODO
		const json = rollup('./specs/parse-scss/controls', 'for');
	});

	it('should deal with @if', () => {
		// TODO
		const json = rollup('./specs/parse-scss/controls', 'if');
	});

	it('should deal with @mixin', () => {
		// TODO
		const json = rollup('./specs/parse-scss/controls', 'mixin');
	});
});