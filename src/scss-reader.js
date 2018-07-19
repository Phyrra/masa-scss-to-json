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
			while (line.length > 0) {
				if (multiLineCommentStarted) {
					const idxStop = line.indexOf('*/');
					if (idxStop === -1) {
						/*
						 * ... Middle ...
						 */
						return '';
					}

					multiLineCommentStarted = false;

					/*
					 * Block end ...
					 */
					line = line.substring(idxStop + 2).trim();
				} else {
					const idxStart = line.indexOf('/*');
					if (idxStart === -1) {
						const lineIdx = line.indexOf('//');
						if (lineIdx === -1) {
							/*
							 * No comment
							 */
							break;
						}
						
						/*
						 * ... // comment
						 */
						line = line.substring(0, lineIdx).trim();
						break;
					}

					const idxStop = line.indexOf('*/', idxStart + 1);
					if (idxStop === -1) {
						multiLineCommentStarted = true;

						/*
						 * ... /*
						 */
						line = line.substring(0, idxStart);
						break;
					}

					/*
					 * Comment start ... Comment end ...
					 */
					line = (line.substring(0, idxStart - 1) + line.substring(idxStop + 2)).trim();
				}
			}

			return line;
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
