"use strict";
// JavaScript keywords and their equivalent lambda calculus representations
Object.defineProperty(exports, "__esModule", { value: true });
exports.keywordMapping = void 0;
exports.keywordMapping = {
    'true': '(λx.λy.x)',
    'false': '(λx.λy.y)',
    'if': '(λp.λa.λb.p a b)' // Church encoding of if
};
//# sourceMappingURL=keywords.js.map