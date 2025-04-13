/**
 * De Bruijn index calculator for lambda expressions
 * Converts named variables to indices for diagram layout
 */

// Convert lambda expression to De Bruijn notation
function toDeBruijn(term) {
  return convertTerm(term, []);
}

// Convert a term to De Bruijn notation
function convertTerm(term, context) {
  switch (term.type) {
    case 'variable':
      const index = context.lastIndexOf(term.name);
      if (index === -1) {
        // Free variable - represent as negative index
        // Find where it would be bound if more lambdas were added
        const freeVarIndex = -1 - (context.length - index);
        return { type: 'variable', index: freeVarIndex };
      }
      return { type: 'variable', index: context.length - 1 - index };

    case 'abstraction':
      const newContext = [term.variable, ...context];
      const body = convertTerm(term.body, newContext);
      return { type: 'abstraction', body };

    case 'application':
      const left = convertTerm(term.left, context);
      const right = convertTerm(term.right, context);
      return { type: 'application', left, right };

    default:
      throw new Error(`Unknown term type: ${term.type}`);
  }
}

// Calculate the height needed for a De Bruijn term
function calculateHeight(term) {
  switch (term.type) {
    case 'variable':
      return term.index >= 0 ? term.index + 1 : 0; // Height is index + 1 for bound vars

    case 'abstraction':
      return 1 + calculateHeight(term.body); // +1 for the lambda line

    case 'application':
      return Math.max(calculateHeight(term.left), calculateHeight(term.right)) + 1;

    default:
      throw new Error(`Unknown term type: ${term.type}`);
  }
}

// Calculate the width needed for a De Bruijn term
function calculateWidth(term, useAlternative = false) {
  switch (term.type) {
    case 'variable':
      return 1; // Each variable takes 1 unit width

    case 'abstraction':
      return calculateWidth(term.body, useAlternative);

    case 'application': {
      // For standard style, sum the widths
      if (!useAlternative) {
        return calculateWidth(term.left, useAlternative) + calculateWidth(term.right, useAlternative);
      }
      
      // For alternative style, more complex calculation
      const leftWidth = calculateWidth(term.left, useAlternative);
      const rightWidth = calculateWidth(term.right, useAlternative);
      
      // In alternative style, applications can overlap
      return Math.max(leftWidth, rightWidth);
    }

    default:
      throw new Error(`Unknown term type: ${term.type}`);
  }
}

// Count the number of variables in a term
function countVariables(term) {
  switch (term.type) {
    case 'variable':
      return 1;
      
    case 'abstraction':
      return countVariables(term.body);
      
    case 'application':
      return countVariables(term.left) + countVariables(term.right);
      
    default:
      throw new Error(`Unknown term type: ${term.type}`);
  }
}

// Find all variable indices used in a term
function collectVariableIndices(term) {
  const indices = new Set();
  
  function collect(t) {
    if (t.type === 'variable') {
      indices.add(t.index);
    } else if (t.type === 'abstraction') {
      collect(t.body);
    } else if (t.type === 'application') {
      collect(t.left);
      collect(t.right);
    }
  }
  
  collect(term);
  return [...indices].sort((a, b) => a - b);
}

module.exports = {
  toDeBruijn,
  calculateHeight,
  calculateWidth,
  countVariables,
  collectVariableIndices
};