Usage
=====

Install the tool from [npmjs.com](https://www.npmjs.com/package/masa-scss-to-json) with `yarn add masa-scss-to-json`.

Create a task in the `scripts` part of the `package.json`:
```
"scripts": {
	"scss-to-json": "masa-scss-to-json scssToJson.conf.js"
}
```

Add the config file:
```
module.exports = {
	baseDir: './scss',
	file: 'definitions',
	out: 'out.json'
}
```

### Syntax

Supports SCSS syntax.

Variables are declared as `$var: 1;`
Multiple declarations on a single line are supported.

Arrays are supported, they need to be declared as `$arr: (1, 2, 3)` (or split into multiple lines).
Both trailing and leading comma syntax is supported.

Comments are supported (but ignored).

CSS-rules are supported (but ignored). Nested variables won't be included in the final result.

Variables containing other variables in their value, such as `$border: $border-size solid $border-color;` will be substituted.

Calculations in `#{..}` are supported, "flat" calculations (such as `$var: $a + 1`) are not.

### Imports

Imports are supported. The `.scss` suffix is not required.

They can be relative:
* `@import "local-file";`
* `@import "../lower-level-file";`

They can be absolute:
* `@import "~scss-folder/file";`

### Default

Default values are supported. The non-default needs to occur before the declaration of default.

```
// branding.scss
$var: 2;

// definitions.scss
@import "branding";

$var: 1 !default;

// scssToJson.conf.js
module.exports = {
	baseDir: './',
	file: 'definitions'
}
```
