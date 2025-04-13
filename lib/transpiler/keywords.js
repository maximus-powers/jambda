// Combine all keyword handlers
const functionParser = require('./function-parser');
const returnParser = require('./return-parser');

module.exports = [
  functionParser,
  returnParser
];