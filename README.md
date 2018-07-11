Usage
=====

Call the function with the root file as the argument, the `.scss` suffix is not required.

The function returns a JSON with all the variables.

### Syntax

Supports SCSS syntax.

Variables are declared as `$var: 1;`

Comments are supported (but ignored).

### Imports

Imports are supported. The `.scss` suffix is not required. Currently only double quoted imports are supported.

They can be relative:
* `@import "local-file";
* `@import "../lower-level-file";

They can be absolute:
* `@import "~scss-folder/file";

Example
=======

```
const scssToJson = import('index.js');

console.log(scssToJson('my-scss-file'));
```