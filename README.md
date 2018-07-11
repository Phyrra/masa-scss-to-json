Usage
=====

Call the function with the root file as the argument, the `.scss` suffix is not required.
An optional second argument can be provided, to write the output to a file.

The function returns a JSON with all the variables.

### Syntax

Supports SCSS syntax.

Variables are declared as `$var: 1;`

Comments are supported (but ignored).

### Imports

Imports are supported. The `.scss` suffix is not required. Currently only double quoted imports are supported.

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

// Call
console.log(scssToJson('definitions')); // { var: 2 }
```

Examples
========

```
const scssToJson = import('masa-scss-to-json');

console.log(scssToJson('my-scss-file')); // { a: 1, b: '40px' }
```

```
const scssToJson = require('masa-scss-to-json');

console.log(
	scssToJson('my-scss-file', 'out.json')
);
// { a: 1, b: '40px' }
// out.json created
```
