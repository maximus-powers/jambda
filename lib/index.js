// Enhanced js-to-lambda parser that includes arithmetic operations
const bodyParser = require('./body-parser');
const uglifyjs = require('uglify-js');

function parse(str) {
  const ast = uglifyjs.parse(str);
  return bodyParser(ast.body);
}

module.exports = {
  parse
};