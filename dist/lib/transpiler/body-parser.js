"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = bodyParser;
// Enhanced body parser to handle arithmetic operations for diagram.hs compatibility
const node_parser_1 = __importDefault(require("./node-parser"));
function bodyParser(body, freeVars = []) {
    // For lambda calculus output, we need to process statements differently
    // First, extract all variable declarations
    const declarations = [];
    let returnStatement = '';
    for (const node of body) {
        const parsed = (0, node_parser_1.default)(node, freeVars);
        // Check if it's a return statement
        if (node.start && node.start.value === 'return') {
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
    const results = body.map(node => (0, node_parser_1.default)(node, freeVars));
    return results.join('\n\n');
}
//# sourceMappingURL=body-parser.js.map