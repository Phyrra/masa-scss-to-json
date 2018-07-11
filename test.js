const scssToJson = require('./masa-scss-to-json');

// 0 is node
// 1 is script
// from 2 it's param
let startFile = process.argv[2];

console.log(scssToJson(startFile || 'scss/definitions'));