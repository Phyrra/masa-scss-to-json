function joinSelectors(parentSelector, selector) {
	return (parentSelector + (selector.startsWith('&') ? selector.substring(1) : ' ' + selector)).trim();
}

function mapProperty(property) {
	return property.name + ': ' + property.value + (property.important ? ' !important' : '');
}

function writeRule(parentSelectors, rule) {
	const selectors = parentSelectors
		.map(parent =>
			rule.selector.split(',')
				.map(selector => joinSelectors(parent, selector.trim()))
		)
		.reduce((all, s) => all.concat(s), []);

	let result = [];

	if (rule.properties.length > 0) {
		result.push(
			selectors
				.join(',\r\n') +
				' {\r\n' +
				rule.properties
					.map(property => '\t' + mapProperty(property) + ';')
					.join('\r\n') +
				'\r\n}'
		);
	}

	if (rule.rules.length > 0) {
		result.push(
			rule.rules
				.map(rule => writeRule(selectors, rule))
				.join('\r\n\r\n')
		);
	}

	return result.join('\r\n\r\n');
}

function toCss(scss) {
	return scss.rules.map(rule => writeRule([''], rule))
		.filter(result => result.trim().length > 0)
		.join('\r\n\r\n');
}

module.exports = toCss;