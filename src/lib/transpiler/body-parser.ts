// Enhanced body parser to handle arithmetic operations for diagram.hs compatibility
import nodeParser from './node-parser';

export default function bodyParser(body: Array<Record<string, unknown>>, freeVars: string[] = []): string {
  // For lambda calculus output, we need to process statements differently
  // First, extract all variable declarations
  const declarations: string[] = [];
  let returnStatement = '';
  
  for (const node of body) {
    const parsed = nodeParser(node, freeVars);
    
    // Check if it's a return statement
    const typedNode = node as { start?: { value?: string } };
    if (typedNode.start && typedNode.start.value === 'return') {
      returnStatement = parsed;
    } 
    // Otherwise it's likely a declaration
    else if (parsed.includes(':=')) {
      declarations.push(parsed);
    }
  }
  
  // Return only the final expression for pure lambda calculus
  if (returnStatement) {
    return returnStatement;
  }
  
  // If no structured output possible, just return statements separated by newlines
  const results = body.map(node => nodeParser(node, freeVars));
  return results.join('\n\n');
}