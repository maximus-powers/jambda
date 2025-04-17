import nodeParser from './node-parser';

export default function returnParser(node: Record<string, unknown>, freeVars: string[]): string {
  const startNode = node.start as { value?: string } | undefined;
  
  if (startNode && startNode.value === 'return') {
    // Parse the expression in the return statement
    const expression = nodeParser(node.value, freeVars);
    return expression;
  }
  
  // If not a return statement, return empty string
  return '';
}