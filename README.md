Usage
=====

Install the tool from [npmjs.com](https://www.npmjs.com/package/masa-scss-to-json) with `yarn install masa-scss-to-json`.

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

Comments are supported (but ignored).

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
