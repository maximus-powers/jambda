
// Enhanced body parser to handle arithmetic operations for diagram.hs compatibility
const nodeParser = require('./node-parser');

module.exports = function(body, freeVars=[]) {
  // For lambda calculus output, we need to process statements differently
  // First, extract all variable declarations
  const declarations = [];
  let returnStatement = '';
  
  for (const node of body) {
    const parsed = nodeParser(node, freeVars);
    
    // Check if it's a return statement
    if (node.start && node.start.value === 'return') {
      returnStatement = parsed;
    } 
    // Otherwise it's likely a declaration
    else if (parsed.includes(':=')) {
      declarations.push(parsed);
    }
  }
  
  // Format for diagram.hs compatibility
  if (declarations.length > 0 && returnStatement) {
    // For diagram.hs, we need a "let ... in ..." format which it will parse
    // as a properly nested lambda expression
    let formattedDeclarations = [];
    
    for (let i = 0; i < declarations.length; i++) {
      const parts = declarations[i].split(':=');
      if (parts.length === 2) {
        const name = parts[0].trim();
        const value = parts[1].trim();
        formattedDeclarations.push(`${name} = ${value}`);
      }
    }
    
    return `let ${formattedDeclarations.join('; ')} in ${returnStatement}`;
  }
  
  // If no structured output possible, just return statements separated by newlines
  const results = body.map(node => nodeParser(node, freeVars));
  return results.join('\n\n');
};