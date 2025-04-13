// JavaScript keywords and their equivalent lambda calculus representations

export const keywordMapping: Record<string, string> = {
  'true': '(λx.λy.x)',    // Church encoding of true
  'false': '(λx.λy.y)',   // Church encoding of false
  'if': '(λp.λa.λb.p a b)' // Church encoding of if
};