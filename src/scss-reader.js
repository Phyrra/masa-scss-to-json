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

function removeRulesFromLines(lines) {
	let ruleStack = 0;

	return getCleanedLines(
		lines
			.map(line => {
				const matchStart = isRuleStart(line);
				let matchEnd;

				if (matchStart) {
					++ruleStack;

					matchEnd = isRuleEnd(
						line.substring(matchStart[0].length + 1)
					);

					if (matchEnd) {
						--ruleStack;

						/*
						* .selector { property: value; } ...
						*/
						if (ruleStack === 0) {
							return line.substring(matchStart[0].length + 1 + matchEnd[0].length + 1).trim();
						}
					}

					/*
					 * ... .selector {
					 */
					return line.substring(0, matchStart.index);
				}

				matchEnd = isRuleEnd(line);
				if (matchEnd) {
					--ruleStack;

					/*
					 * } ...
					 */
					if (ruleStack === 0) {
						return line.substring(matchEnd[0].length + 1).trim();
					}
				}

				if (ruleStack > 0) {
					return '';
				}

				return line;
			})
	);
}

function isRuleStart(line) {
	return line.match(/^[^@${}()#]([^#{]|(#{)?)*\{/);
}

function isRuleEnd(line) {
	return line.match(/\s*[^}]*\}/);
}

function splitMultiDeclarations(lines) {
	return getCleanedLines(
		lines
			.map(line => line.split(/([^;]+;)/))
			.reduce((all, splits) => all.concat(splits), [])
	);
}

module.exports = (file) => {
	return splitMultiDeclarations(
		removeRulesFromLines(
			removeCommentsFromLines(
				getCleanedLines(
					readLinesFromFile(file)
				)
			)
		)
	);
}
