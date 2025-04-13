// Parse AST nodes from UglifyJS into lambda calculus
import functionParser from './function-parser';
import returnParser from './return-parser';
import { operatorMapping } from './operators';

/**
 * Parse different node types from JavaScript AST to lambda calculus
 */
export default function nodeParser(node: any, freeVars: string[] = []): string {
  // Base case: handle primitive values
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return String(node);
  }
  
  // Handle undefined node
  if (!node) return '';
  
  // Different parsing strategies based on node type
  if (node.start && node.start.value === 'function') {
    return functionParser(node, freeVars);
  }
  
  if (node.start && node.start.value === 'return') {
    return returnParser(node, freeVars);
  }
  
  // Handle variable/symbol reference
  if (node.name) {
    return node.name;
  }
  
  // Handle variable declaration
  if (node.TYPE === 'VarDef') {
    const varValue = nodeParser(node.value, freeVars);
    return `${node.name.name} := ${varValue}`;
  }
  
  // Handle binary operations (arithmetic)
  if (node.operator && node.left && node.right) {
    const left = nodeParser(node.left, freeVars);
    const right = nodeParser(node.right, freeVars);
    
    // Map operator to lambda calculus representation if defined
    const operator = operatorMapping[node.operator] || node.operator;
    
    // Format in lambda calculus application style - no infix
    return `(${operator} ${left} ${right})`;
  }
  
  // Handle numeric literals directly
  if (node.TYPE === 'Number') {
    return node.value.toString();
  }
  
  // Handle string literals
  if (node.TYPE === 'String') {
    return `"${node.value}"`;
  }
  
  // Handle variable assignment
  if (node.TYPE === 'Assign') {
    const leftName = node.left.name;
    const rightValue = nodeParser(node.right, freeVars);
    return `${leftName} := ${rightValue}`;
  }
  
  // Handle function calls
  if (node.TYPE === 'Call') {
    const functionName = nodeParser(node.expression, freeVars);
    const args = node.args.map((arg: any) => nodeParser(arg, freeVars));
    
    // Apply arguments one by one in lambda calculus style
    return `(${[functionName, ...args].join(' ')})`;
  }
  
  // Handle object properties
  if (node.property) {
    const objName = nodeParser(node.expression, freeVars);
    return `${objName}.${node.property}`;
  }
  
  // Fall back to empty string for unsupported nodes
  console.warn('Unsupported node type:', node);
  return '';
}