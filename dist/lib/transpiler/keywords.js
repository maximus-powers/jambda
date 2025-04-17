"use strict";
// JavaScript keywords and their equivalent lambda calculus representations
Object.defineProperty(exports, "__esModule", { value: true });
exports.keywordMapping = void 0;
exports.keywordMapping = {
    'true': '(λx.λy.x)', // Church encoding of true
    'false': '(λx.λy.y)', // Church encoding of false
    'if': '(λp.λa.λb.p a b)' // Church encoding of if
};
//# sourceMappingURL=keywords.js.map