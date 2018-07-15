const fs = require('fs');

function readLinesFromFile(file) {
	if (!file.endsWith('.scss')) {
		file = file + '.scss';
	}

	return fs.readFileSync(file, 'utf8')
		.split(/\n/);
}

function getCleanedLines(lines) {
	return lines
		.map(line => line.trim())
		.filter(line => line.length > 0);
}

function removeCommentsFromLines(lines) {
	let multiLineCommentStarted = false;

	return getCleanedLines(
		lines
			.map(line => {
				const idx = line.indexOf('//');

				if (idx !== -1) {
					return line.substring(0, idx - 1);
				}

				return line;
			})
			.map(line => {
				if (multiLineCommentStarted) {
					const idxStop = line.indexOf('*/');
					if (idxStop === -1) {
						return '';
					}

					multiLineCommentStarted = false;

					return line.substring(idxStop + 2);
				} else {
					const idxStart = line.indexOf('/*');
					if (idxStart === -1) {
						return line;
					}

					const idxStop = line.indexOf('*/', idxStart + 1);
					if (idxStop === -1) {
						multiLineCommentStarted = true;

						return '';
					}

					return line.substring(0, idxStart - 1) + line.substring(idxStop + 2);
				}
			})
	);
}

module.exports = (file) => {
	return removeCommentsFromLines(
		getCleanedLines(
			readLinesFromFile(file)
		)
	);
};
