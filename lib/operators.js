// Parse arithmetic operations

// Helpers to convert binary operations to lambda expressions
function formatBinaryOperation(operator, left, right) {
  // Simplified format for cleaner output
  switch (operator) {
    case '+':
      return `(${left} + ${right})`;
    case '-':
      return `(${left} - ${right})`;
    case '*':
      return `(${left} * ${right})`;
    case '/':
      return `(${left} / ${right})`;
    default:
      return `(${operator} ${left} ${right})`;
  }
}

// Parse literal values (numbers, strings)
function parseLiteral(node) {
  if (node && node.start && node.start.type === 'num') {
    return node.start.raw || node.value.toString();
  }
  return null;
}

// Parse binary expressions (operations like +, -, *, /, etc.)
function parseBinaryOperation(node, freeVars) {
  if (node && node.operator) {
    // This looks like a binary operation node in the UglifyJS AST
    const nodeParser = require('./node-parser'); // Require here to avoid circular references
    
    // Get left and right operands
    let left, right;
    
    if (node.left) {
      if (node.left.name) {
        left = node.left.name;
      } else if (node.left.value !== undefined) {
        left = node.left.value.toString();
      } else {
        left = nodeParser(node.left, freeVars);
      }
    }
    
    if (node.right) {
      if (node.right.name) {
        right = node.right.name;
      } else if (node.right.value !== undefined) {
        right = node.right.value.toString();
      } else {
        right = nodeParser(node.right, freeVars);
      }
    }
    
    // Convert operators to function application style
    // This format works with diagram.hs
    const op = node.operator.toLowerCase();
    return `(${op} ${left} ${right})`;
  }
  return null;
}

// Parse dot notation (member expressions like obj.prop, Math.cos)
function parseDotNotation(node, freeVars) {
  // Check if this looks like a dot notation in UglifyJS AST
  if (node && 
      node.expression && 
      node.property && 
      typeof node.property === 'string') {
    
    const nodeParser = require('./node-parser');
    let object;
    
    // Get the object part
    if (node.expression.name) {
      object = node.expression.name;
    } else {
      object = nodeParser(node.expression, freeVars);
    }
    
    // Format for diagram.hs
    if (object === 'Math') {
      // Special case for Math.PI - use 'pi' directly for diagram.hs
      if (node.property === 'PI') {
        return 'pi';
      }
      
      // For diagram.hs, use just the method name as a separate identifier
      return node.property.toLowerCase();
    }
    
    // For other objects, keep dot notation
    return object + '.' + node.property;
  }
  return null;
}

// Parse function calls like fn(), Math.cos(), etc.
function parseCall(node, freeVars) {
  // Check if this node has 'args' array, indicating a function call
  if (node && Array.isArray(node.args)) {
    const nodeParser = require('./node-parser');
    
    // Get the function being called
    let callee = '';
    if (node.expression) {
      callee = nodeParser(node.expression, freeVars);
    }
    
    // Process all arguments
    const args = [];
    for (const arg of node.args) {
      if (arg.name) {
        args.push(arg.name);
      } else if (arg.value !== undefined) {
        args.push(arg.value.toString());
      } else {
        args.push(nodeParser(arg, freeVars));
      }
    }
    
    // Handle Math functions specially for diagram.hs
    if (callee === 'cos' || callee === 'sin' || callee === 'tan' || 
        callee === 'sqrt' || callee === 'pow' || 
        callee.includes('Math')) {
      
      // For diagram.hs, extract just the function name
      let funcName = callee;
      
      // Clean up Math prefixes
      if (callee.includes('Math')) {
        if (callee === 'Math') {
          // "Math" alone means the function name is the first arg
          return args.join(' ');
        } else if (callee.includes(' ')) {
          // Clean up "Math Math" pattern
          funcName = callee.replace(/Math\s+Math\s+/, '');
        } else if (callee.includes('Math_')) {
          // Clean up Math_ prefix
          funcName = callee.replace(/Math_/, '');
        } else if (callee.includes('.')) {
          // Extract function name after dot (Math.cos)
          funcName = callee.substring(callee.indexOf('.') + 1);
        }
      }
      
      // Use lowercase function name for diagram.hs
      return `${funcName.toLowerCase()} ${args.join(' ')}`;
    }
    
    // Standard lambda calculus style function application (no parentheses)
    if (args.length === 0) {
      return callee;
    } else {
      return `${callee} ${args.join(' ')}`;
    }
  }
  return null;
}

module.exports = [parseLiteral, parseBinaryOperation, parseDotNotation, parseCall];