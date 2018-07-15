function formatObj(json, indent) {
	const baseIndentation = '\t'.repeat(indent);
	const valueIndentation = '\t'.repeat(indent + 1);

	const keys = Object.keys(json);
	const objLines = keys
		.map((key, idx) => {
			const lead = valueIndentation + '"' + key + '": ';

			const value = json[key];
			
			let lines;
			if (typeof value === 'number' || typeof value === 'boolean') {
				lines = [lead + value];
			} else if (typeof value === 'string') {
				lines = [lead + '"' + formatString(value) + '"'];
			} else if (Array.isArray(value)) {
				const innerLines = formatArray(value, indent + 1);

				lines = [
					lead + innerLines[0].trim(),
					...innerLines.slice(1)
				];
			} else {
				const innerLines = formatObj(value, indent + 1);

				lines = [
					lead + innerLines[0].trim(),
					...innerLines.slice(1)
				];
			}

			if (idx < keys.length - 1) {
				lines[lines.length - 1] += ',';
			}

			return lines;
		})
		.reduce((arr, val) => arr.concat(val), []);

	if (objLines.length === 0) {
		return ['{}'];
	}

	return [
		baseIndentation + '{',
		...objLines,
		baseIndentation + '}'
	];
}

function formatArray(json, indent) {
	const baseIndentation = '\t'.repeat(indent);
	const valueIndentation = '\t'.repeat(indent + 1);

	const arrLines = json
		.map((value, idx) => {
			let lines;

			if (typeof value === 'number' || typeof value === 'boolean') {
				lines = [valueIndentation + value];
			} else if (typeof value === 'string') {
				lines = [valueIndentation + '"' + formatString(value) + '"'];
			} else if (Array.isArray(value)) {
				lines = formatArray(value, indent + 1);
			} else {
				lines = formatObj(value, indent + 1);
			}

			if (idx < json.length - 1) {
				lines[lines.length - 1] += ',';
			}

			return lines;
		})
		.reduce((arr, val) => arr.concat(val), []);

	if (arrLines.length === 0) {
		return ['[]'];
	}

	return [
		baseIndentation + '[',
		...arrLines,
		baseIndentation + ']'
	];
}

function formatString(value) {
	return value
		.replace(/\r?\n/g, '\\n')
		.replace(/"/g, '\\"');
}

function formatJson(json) {
	let lines;

	if (typeof json === 'number' || typeof json === 'boolean') {
		lines = [json];
	} else if (typeof json === 'string') {
		lines = ['"' + formatString(json) + '"'];
	} else if (Array.isArray(json)) {
		lines = formatArray(json, 0);
	} else {
		lines = formatObj(json, 0);
	}

	return lines.join('\n');
}

module.exports = formatJson;