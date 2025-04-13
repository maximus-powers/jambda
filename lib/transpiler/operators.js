// Parse arithmetic operations to pure lambda calculus

// Pure lambda calculus definitions for arithmetic operations
const CHURCH_PLUS = 'λm.λn.λf.λx.m f (n f x)';
const CHURCH_TIMES = 'λm.λn.λf.m (n f)';
const CHURCH_MINUS = 'λn.λm.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)';
const CHURCH_DIVIDE = 'λn.λm.λf.λx.(n (λp.λq.q ((λm.λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)) p m) λf.λx.p (λr.r (λn.λf.λx.f (n f x)) f) (λn.λf.λx.x) (λu.f (q f x)))) (λu.u) (λv.x)';

// Helper to convert binary operations to lambda calculus expressions
function formatBinaryOperation(operator, left, right) {
  // Use pure lambda calculus encodings
  switch (operator) {
    case '+':
      return `(${CHURCH_PLUS} ${left} ${right})`;
    case '-':
      return `(${CHURCH_MINUS} ${left} ${right})`;
    case '*':
      return `(${CHURCH_TIMES} ${left} ${right})`;
    case '/':
      return `(${CHURCH_DIVIDE} ${left} ${right})`;
    default:
      // Fall back to simple application syntax for unknown operators
      return `(${operator} ${left} ${right})`;
  }
}

// Helper to convert a number to Church numeral lambda expression
function numberToChurchNumeral(num) {
  if (num === 0) {
    return 'λf.λx.x';
  }
  
  // For any positive integer, create the appropriate Church numeral
  // Format: λf.λx.f(f(...f(x)...)) with 'num' applications of f
  let inner = 'x';
  for (let i = 0; i < num; i++) {
    inner = `f (${inner})`;
  }
  return `λf.λx.${inner}`;
}

// Parse literal values (numbers, strings)
function parseLiteral(node) {
  if (node && node.start && node.start.type === 'num') {
    const numValue = parseFloat(node.start.raw || node.value.toString());
    
    // Check if it's an integer - those can be represented directly as Church numerals
    if (Number.isInteger(numValue) && numValue >= 0) {
      return numberToChurchNumeral(numValue);
    }
    
    // For floating point, we'll need to handle it differently
    // For now, just return the number representation
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
        // Check if it's a number and convert to Church numeral
        const numVal = parseFloat(node.left.value.toString());
        if (Number.isInteger(numVal) && numVal >= 0) {
          left = numberToChurchNumeral(numVal);
        } else {
          left = node.left.value.toString();
        }
      } else {
        left = nodeParser(node.left, freeVars);
      }
    }
    
    if (node.right) {
      if (node.right.name) {
        right = node.right.name;
      } else if (node.right.value !== undefined) {
        // Check if it's a number and convert to Church numeral
        const numVal = parseFloat(node.right.value.toString());
        if (Number.isInteger(numVal) && numVal >= 0) {
          right = numberToChurchNumeral(numVal);
        } else {
          right = node.right.value.toString();
        }
      } else {
        right = nodeParser(node.right, freeVars);
      }
    }
    
    // Apply specific lambda calculus operations based on the operator
    switch (node.operator) {
      case '+':
        return formatBinaryOperation('+', left, right);
      case '-':
        return formatBinaryOperation('-', left, right);
      case '*':
        return formatBinaryOperation('*', left, right);
      case '/':
        return formatBinaryOperation('/', left, right);
      default:
        // For other operators, just use function application syntax
        const op = node.operator.toLowerCase();
        return `(${op} ${left} ${right})`;
    }
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