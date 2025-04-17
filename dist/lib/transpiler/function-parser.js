"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseFunction;
const underscore_1 = __importDefault(require("underscore"));
function formatFunction(args, expression) {
    // Format with λ for lambda in standard lambda calculus notation
    return '(λ' + args.join('.λ') + '.' + expression + ')';
}
function parseFunction(node, freeVars) {
    // Dynamic import to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bodyParser = require('./body-parser').default;
    // Type assertion for specific node properties
    const typedNode = node;
    if (typedNode.start && typedNode.start.value === 'function' && typedNode.argnames) {
        const argnames = typedNode.argnames.map((a) => a.name);
        const collisions = underscore_1.default.intersection(argnames, freeVars);
        if (collisions.length > 0) {
            throw new Error(`"${collisions[0]}" is already bound to a parent scope!`);
        }
        const parsedBody = bodyParser(typedNode.body, freeVars.concat(argnames));
        // Format for compatibility with diagram.hs
        return formatFunction(argnames, parsedBody);
    }
    return '';
}
//# sourceMappingURL=function-parser.js.map