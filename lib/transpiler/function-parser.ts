import _ from 'underscore';

function formatFunction(args: string[], expression: string): string {
  // Format with λ for lambda in standard lambda calculus notation
  return '(λ' + args.join('.λ') + '.' + expression + ')';
}

export default function parseFunction(node: any, freeVars: string[]): string {
  // Dynamic import to avoid circular dependencies
  const bodyParser = require('./body-parser').default; 
  
  if (node.start && node.start.value === 'function') {
    const argnames = node.argnames.map((a: any) => a.name);
    const collisions = _.intersection(argnames, freeVars);

    if (collisions.length > 0) {
      throw new Error(`"${collisions[0]}" is already bound to a parent scope!`);
    }

    const parsedBody = bodyParser(node.body, freeVars.concat(argnames));
    
    // Format for compatibility with diagram.hs
    return formatFunction(argnames, parsedBody);
  }
  
  return '';
}