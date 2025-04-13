import nodeParser from './node-parser';

export default function returnParser(node: any, freeVars: string[]): string {
  if (node.start && node.start.value === 'return') {
    // Parse the expression in the return statement
    const expression = nodeParser(node.value, freeVars);
    return expression;
  }
  
  // If not a return statement, return empty string
  return '';
}