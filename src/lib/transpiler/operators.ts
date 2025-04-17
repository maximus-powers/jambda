// Standard operator mappings for lambda calculus representation
// Maps JavaScript operators to lambda calculus operators/functions

export const operatorMapping: Record<string, string> = {
  // Arithmetic operators
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '%': '%',
  
  // Comparison operators 
  '==': 'equals',
  '===': 'equals',
  '!=': 'not-equals',
  '!==': 'not-equals',
  '>': 'gt',
  '<': 'lt',
  '>=': 'gte',
  '<=': 'lte',
  
  // Logical operators
  '&&': 'and',
  '||': 'or',
  '!': 'not'
};