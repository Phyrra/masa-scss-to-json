const rollup = require('./rollup');
const writer = require('./writer');

module.exports = (baseDir, file, out) => {
	const result = rollup(baseDir, file);

	if (out != null) {
		writer(baseDir, out, result);
	}

	return result.variables;
};
