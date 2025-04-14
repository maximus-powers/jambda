"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = __importDefault(require("underscore"));
function formatFunction(args, expression) {
    // Format with λ for lambda in standard lambda calculus notation
    return '(λ' + args.join('.λ') + '.' + expression + ')';
}
function parseFunction(node, freeVars) {
    // Dynamic import to avoid circular dependencies
    const bodyParser = require('./body-parser').default;
    if (node.start && node.start.value === 'function') {
        const argnames = node.argnames.map((a) => a.name);
        const collisions = underscore_1.default.intersection(argnames, freeVars);
        if (collisions.length > 0) {
            throw new Error(`"${collisions[0]}" is already bound to a parent scope!`);
        }
        const parsedBody = bodyParser(node.body, freeVars.concat(argnames));
        // Format for compatibility with diagram.hs
        return formatFunction(argnames, parsedBody);
    }
    return '';
}
exports.default = parseFunction;
//# sourceMappingURL=function-parser.js.map