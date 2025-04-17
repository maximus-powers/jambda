import { parse } from '../../dist/index.js';

const jsCode = `
function add(a, b) {
  return a + b;
}`;

// Convert to lambda calculus
const lambdaExpression = parse(jsCode);
console.log(lambdaExpression);