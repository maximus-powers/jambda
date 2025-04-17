"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = returnParser;
const node_parser_1 = __importDefault(require("./node-parser"));
function returnParser(node, freeVars) {
    const startNode = node.start;
    if (startNode && startNode.value === 'return') {
        // Parse the expression in the return statement
        const expression = (0, node_parser_1.default)(node.value, freeVars);
        return expression;
    }
    // If not a return statement, return empty string
    return '';
}
//# sourceMappingURL=return-parser.js.map