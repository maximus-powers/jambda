module.exports = function parseReturn(node, freeVars) {
  const nodeParser = require('./node-parser');

  if (node.start && node.start.value === 'return') {
    return nodeParser(node.value, freeVars);
  }
};