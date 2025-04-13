const _ = require('underscore');

function formatFunction(args, expression) {
  // Format with "\" for lambda in Haskell syntax
  return args.map(a => '\\' + a).join(' -> ') + ' -> ' + expression;
}

module.exports = function parseFunction(node, freeVars) {
  const bodyParser = require('./body-parser'); // avoid circular deps
  
  if (node.start && node.start.value === 'function') {
    const argnames = node.argnames.map(a => a.name);
    const collisions = _.intersection(argnames, freeVars);

    if (collisions.length > 0) {
      throw new Error(`"${collisions[0]}" is already bound to a parent scope!`);
    }

    const parsedBody = bodyParser(node.body, freeVars.concat(argnames));
    
    // Format for compatibility with diagram.hs
    return formatFunction(argnames, parsedBody);
  }
};