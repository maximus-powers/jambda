// Extended node parser that handles arithmetic operations
const operators = require('./operators');
const functionParser = require('./function-parser');
const returnParser = require('./return-parser');

// Name parser from original lib
const originalName = require('js-to-lambda/parsers/name');

// Variable declarations parser
function parseDeclaration(node, freeVars) {
  const nodeParser = require('./node-parser'); // Avoid circular deps
  
  if (node.definitions && node.definitions.length > 0) {
    const results = [];
    
    for (const def of node.definitions) {
      if (def.name && def.name.name && def.value) {
        // Get the variable name
        const varName = def.name.name;
        
        // Parse the value
        const value = nodeParser(def.value, freeVars);
        
        // Add the variable to free vars to track it
        if (!freeVars.includes(varName)) {
          freeVars.push(varName);
        }
        
        // Output the declaration in lambda calculus style
        return `${varName} := ${value}`;
      }
    }
    
    return results.join('; ');
  }
  
  return null;
}

// Variable reference parser
function parseVarReference(node, freeVars) {
  if (node.name && freeVars.includes(node.name)) {
    return node.name;
  }
  return null;
}

// Combine all parsers
const nodetypes = [
  ...originalName,
  functionParser,
  returnParser,
  parseDeclaration,
  parseVarReference,
  ...operators
];

module.exports = function(node, freeVars=[]) {
  if (!node) return '';
  
  const results = nodetypes.reduce(function(memo, fn) {
    try {
      const reduction = fn(node, freeVars);
      if (reduction) {
        memo = memo.concat(reduction);
      }
    } catch (err) {
      console.error('Parser error:', err);
    }
    return memo;
  }, []);

  return results.join(' ');
};