import _ from 'underscore';

function formatFunction(args: string[], expression: string): string {
  // Format with λ for lambda in standard lambda calculus notation
  return '(λ' + args.join('.λ') + '.' + expression + ')';
}

export default function parseFunction(node: Record<string, unknown>, freeVars: string[]): string {
  // Dynamic import to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bodyParser = require('./body-parser').default; 
  
  // Type assertion for specific node properties
  const typedNode = node as {
    start?: { value?: string };
    argnames?: Array<{ name: string }>;
    body: Array<Record<string, unknown>>;
  };

  if (typedNode.start && typedNode.start.value === 'function' && typedNode.argnames) {
    const argnames = typedNode.argnames.map((a) => a.name);
    const collisions = _.intersection(argnames, freeVars);

    if (collisions.length > 0) {
      throw new Error(`"${collisions[0]}" is already bound to a parent scope!`);
    }

    const parsedBody = bodyParser(typedNode.body, freeVars.concat(argnames));
    
    // Format for compatibility with diagram.hs
    return formatFunction(argnames, parsedBody);
  }
  
  return '';
}