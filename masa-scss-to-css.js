const rollup = require('./src/rollup');
const toCss = require('./src/css');
const writer = require('./src/file-writer');

module.exports = (baseDir, file, out) => {
	const result = toCss(
		rollup(baseDir, file)
	);

	if (out != null) {
		writer(baseDir, out, result);
	}

	return result;
};