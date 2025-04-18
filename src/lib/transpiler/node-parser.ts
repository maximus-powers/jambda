// parse ast nodes to lambda calc
import functionParser from './function-parser';
import returnParser from './return-parser';
import { operatorMapping } from './operators';

// parse diff node types from js ast
export default function nodeParser(node: unknown, freeVars: string[] = []): string {
  // primitive values
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return String(node);
  }
  
  if (!node) return '';
  
  if (node === null || typeof node !== 'object') {
    return '';
  }

  // type casting
  const typedNode = node as Record<string, unknown>;
  const startNode = typedNode.start as { value?: string } | undefined;
  
  // parsing based on node type
  if (startNode && startNode.value === 'function') {
    return functionParser(typedNode as Record<string, unknown>, freeVars);
  }
  
  if (startNode && startNode.value === 'return') {
    return returnParser(typedNode as Record<string, unknown>, freeVars);
  }
  
  // Handle variable/symbol reference
  if (typedNode.name && typeof typedNode.name === 'string') {
    return typedNode.name;
  }
  
  // Handle variable declaration
  if (typedNode.TYPE === 'VarDef') {
    const nameNode = typedNode.name as { name: string } | undefined;
    if (!nameNode) return '';
    
    const varValue = nodeParser(typedNode.value, freeVars);
    return `${nameNode.name} := ${varValue}`;
  }
  
  // Handle binary operations (arithmetic)
  if (typedNode.operator && typedNode.left && typedNode.right) {
    const left = nodeParser(typedNode.left, freeVars);
    const right = nodeParser(typedNode.right, freeVars);
    
    // Map operator to lambda calculus representation if defined
    const operatorKey = String(typedNode.operator);
    const operator = operatorMapping[operatorKey] || operatorKey;
    
    // Format in lambda calculus application style - no infix
    return `(${operator} ${left} ${right})`;
  }
  
  // Handle numeric literals directly
  if (typedNode.TYPE === 'Number') {
    const value = typedNode.value;
    return value !== undefined ? String(value) : '';
  }
  
  // Handle string literals
  if (typedNode.TYPE === 'String') {
    const value = typedNode.value;
    return value !== undefined ? `"${value}"` : '';
  }
  
  // Handle variable assignment
  if (typedNode.TYPE === 'Assign') {
    const leftNode = typedNode.left as { name: string } | undefined;
    if (!leftNode || !leftNode.name) return '';
    
    const rightValue = nodeParser(typedNode.right, freeVars);
    return `${leftNode.name} := ${rightValue}`;
  }
  
  // Handle function calls
  if (typedNode.TYPE === 'Call') {
    const functionName = nodeParser(typedNode.expression, freeVars);
    const argsArray = typedNode.args as unknown[] | undefined;
    
    if (!argsArray) return `(${functionName})`;
    
    const args = argsArray.map(arg => nodeParser(arg, freeVars));
    
    // Apply arguments one by one in lambda calculus style
    return `(${[functionName, ...args].join(' ')})`;
  }
  
  // Handle object properties
  if (typedNode.property) {
    const objName = nodeParser(typedNode.expression, freeVars);
    return `${objName}.${String(typedNode.property)}`;
  }
  
  // Fall back to empty string for unsupported nodes
  console.warn('Unsupported node type:', typedNode);
  return '';
}