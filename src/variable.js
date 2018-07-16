// TODO: Treat #{..}
// TODO: Treat calculations

const KNOWN_FUNCTIONS = {
	'nth': (args, variables) => {
		if (!args[0].startsWith('$')) {
			throw new Error(`Expected variable, got ${args[0]}`);
		}

		const arrName = args[0].substring(1);
		if (!variables.hasOwnProperty(arrName)) {
			throw new Error(`Unknown variable ${arrName}`);
		}

		const arr = variables[arrName];
		if (!Array.isArray(arr)) {
			throw new Error(`Expected array, got ${typeof arr}`);
		}

		let idx;
		if (args[1].startsWith('$')) {
			const idxName = args[1].substring(1);
			if (!variables.hasOwnProperty(idxName)) {
				throw new Error(`Unknown variable ${idxName}`);
			}

			idx = variables[idxName];
		} else {
			idx = args[1];
		}

		if (!idx.toString().match(/^\d+$/)) {
			throw new Error(`Expected int, got ${idx}`);
		}

		const intIdx = parseInt(idx, 10) - 1;
		if (intIdx >= arr.length) {
			throw new Error(`Array index out of bounds`);
		}

		return arr[intIdx];
	}
}

function replaceVariableValues(value, variables) {
	return value
		.replace(/([\w-]+)\(([^\)]*)\)/g, (grp) => {
			const match = grp.match(/([\w-]+)\(([^\)]*)\)/);

			if (KNOWN_FUNCTIONS.hasOwnProperty(match[1])) {
				const args = match[2].split(',')
					.map(arg => arg.trim());

				return KNOWN_FUNCTIONS[match[1]](args, variables);
			}

			return grp;
		})
		.replace(/\$[^\s,]+/g, (grp) => {
			const name = grp.substring(1);

			if (!variables.hasOwnProperty(name)) {
				throw new Error(`Unknown variable ${name}`);
			}

			return variables[name].toString();
		}).trim();
}

function resolvePropertyValue(value, variables) {
	return replaceVariableValues(value, variables);
}

function getNumbersAsNumbers(value) {
	if (value.match(/^[+-]?\d+$/)) {
		return parseInt(value, 10);
	}

	if (value.match(/^[+-]?(\d*\.\d+|\d+\.\d*)$/)) {
		return parseFloat(value);
	}

	return value;
}

function resolveVariableValue(value, variables) {
	return getNumbersAsNumbers(
		replaceVariableValues(value.toString(), variables)
	);
}

module.exports = {
	resolveVariable: resolveVariableValue,
	resolveProperty: resolvePropertyValue
};
