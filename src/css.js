function joinSelectors(parentSelector, selector) {
	return (parentSelector + (selector.startsWith('&') ? selector.substring(1) : ' ' + selector)).trim();
}

function joinMediaQuery(rule) {
	return '@media' +
		(rule.mediaType.modifier ? ` ${rule.mediaType.modifier}` : '') +
		` ${rule.mediaType.type} ` +
		rule.mediaConditions
			.map(condition => `${condition.modifier} (${condition.property}: ${condition.value})`)
			.join(' ');
}

function mapProperty(property) {
	return property.name + ': ' + property.value + (property.important ? ' !important' : '');
}

function writeMediaRule(rule) {
	let result = [];

	const mediaQuery = joinMediaQuery(rule);

	if (rule.rules.length > 0) {
		result.push(
			rule.rules
				.map(rule => writeRule([''], rule, mediaQuery))
				.join('\r\n\r\n')
		);
	}

	return result.join('\r\n\r\n');
}

function writeRule(parentSelectors, rule, parentMediaQuery = null) {
	if (rule.media) {
		throw new Error(`Nested media queries are not supported`);
	}

	let result = [];

	const selectors = parentSelectors
		.map(parent =>
			rule.selector.split(',')
				.map(selector => joinSelectors(parent, selector.trim()))
		)
		.reduce((all, s) => all.concat(s), []);

	let tab = '';
	if (parentMediaQuery) {
		tab = '\t';
	}

	if (rule.properties.length > 0) {
		result.push(
			(parentMediaQuery ? parentMediaQuery + ' {\r\n' : '') +
			selectors
				.map(selector => `${tab}${selector}`)
				.join(',\r\n') +
				' {\r\n' +
				rule.properties
					.map(property => `${tab}\t` + mapProperty(property) + ';')
					.join('\r\n') +
				`\r\n${tab}}` +
			(parentMediaQuery ? '\r\n}' : '')
		);
	}

	if (rule.rules.length > 0) {
		result.push(
			rule.rules
				.map(rule => writeRule(selectors, rule, parentMediaQuery))
				.join('\r\n\r\n')
		);
	}

	return result.join('\r\n\r\n');
}

function toCss(scss) {
	return scss.rules
		.map(rule => {
			return rule.media ?
				writeMediaRule(rule) :
				writeRule([''], rule);
		})
		.filter(result => result.trim().length > 0)
		.join('\r\n\r\n');
}

module.exports = toCss;