class CssRenderer {
	constructor() {
		this._rootLines = [];
	}

	_joinSelectors(parentSelector, selector) {
		return (parentSelector + (selector.startsWith('&') ? selector.substring(1) : ' ' + selector)).trim();
	}

	_combineMediaRules(parent, child) {
		if (parent.mediaType.modifier !== child.mediaType.modifier || parent.mediaType.type !== child.mediaType.type) {
			throw new Error(`Cannot combine media types ${JSON.stringify(parent.mediaType)} and ${JSON.stringify(child.mediaType)}`);
		}

		return {
			media: true,
			mediaType: parent.mediaType,
			mediaConditions: parent.mediaConditions.concat(child.mediaConditions)
		};
	}

	_getMediaQuery(rule) {
		return (
			'@media' +
			(rule.mediaType.modifier ? ` ${rule.mediaType.modifier}` : '') +
			` ${rule.mediaType.type} ` +
			rule.mediaConditions
				.map(condition => `${condition.modifier} (${condition.property}: ${condition.value})`)
				.join(' ')
		).trim();
	}

	_mapProperty(property) {
		return property.name + ': ' + property.value + (property.important ? ' !important' : '');
	}

	_writeProperties(selectors, properties, indentation) {
		const header = selectors
			.map(selector => `${indentation}${selector}`)
			.join(',\r\n')
			.trim();

		if (header.length > 0) {
			return `${indentation}${header} {\r\n` +
				properties
					.map(property => `${indentation}\t` + this._mapProperty(property) + ';')
					.join('\r\n') +
				`\r\n${indentation}}`;
		} else {
			return properties
				.map(property => `${indentation}` + this._mapProperty(property) + ';')
				.join('\r\n');
		}
	}

	_joinLines(lines) {
		return lines
			.filter(line => line.trim().length > 0)
			.join('\r\n\r\n');
	}

	_writeMediaRule(rule, parentSelectors = [''], parentMediaRule = null) {
		const mediaRule = parentMediaRule ? this._combineMediaRules(parentMediaRule, rule) : rule;
		const mediaQuery = this._getMediaQuery(mediaRule);

		const children = [];

		if (rule.properties.length > 0) {
			children.push(
				this._writeProperties(parentSelectors, rule.properties, '\t')
			);
		}

		rule.rules
			.filter(r => !r.media)
			.forEach(r => children.push(
				this._writeRule(r, parentSelectors, mediaRule)
			));

		const childRules = this._joinLines(
			children
		);

		if (childRules.trim().length > 0) {
			this._rootLines.push(
				mediaQuery + ' {\r\n' + childRules + '\r\n}'
			);
		}

		rule.rules
			.filter(r => r.media)
			.forEach(r => this._writeMediaRule(r, parentSelectors, mediaRule));
	}

	_writeRule(rule, parentSelectors = [''], mediaRule = null) {
		let result = [];

		const indentation = mediaRule ? '\t' : '';

		const selectors = parentSelectors
			.map(parent =>
				rule.selector.split(',')
					.map(selector => this._joinSelectors(parent, selector.trim()))
			)
			.reduce((all, s) => all.concat(s), []);

		if (rule.properties.length > 0) {
			result.push(
				this._writeProperties(selectors, rule.properties, indentation)
			);
		}

		if (rule.rules.length > 0) {
			const childRules = rule.rules
				.filter(rule => !rule.media);

			if (childRules.length > 0) {
				result.push(
					this._joinLines(
						childRules
							.map(rule => this._writeRule(rule, selectors, mediaRule))
					)
				);
			}

			const mediaRules = rule.rules
				.filter(rule => rule.media);

			if (mediaRules.length > 0)  {
				mediaRules
					.map(rule => this._writeMediaRule(rule, selectors, mediaRule));
			}
		}

		return this._joinLines(result);
	}

	toCss(scss) {
		scss.rules
			.filter(rule => rule.media)
			.forEach(rule => this._writeMediaRule(rule));


		scss.rules
			.filter(rule => !rule.media)
			.forEach(rule => this._rootLines.push(
				this._writeRule(rule)
			));

		return this._joinLines(this._rootLines);
	}
}

module.exports = (scss) => new CssRenderer().toCss(scss);
