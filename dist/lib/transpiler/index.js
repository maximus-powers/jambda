"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
// General-purpose JavaScript/TypeScript to Lambda calculus transpiler
const esprima = __importStar(require("esprima"));
const fs = __importStar(require("fs"));
const ts = __importStar(require("typescript"));
// Lambda calculus notation constants
const LAMBDA = 'λ';
// Church numerals for common numbers (0 to 10)
const CHURCH_NUMERALS = {};
/**
 * Generate Church numerals - λf.λx.f^n(x)
 * For example, 3 is λf.λx.f(f(f(x)))
 */
function generateChurchNumerals(max = 100) {
    for (let i = 0; i <= max; i++) {
        let inner = 'x';
        for (let j = 0; j < i; j++) {
            inner = `f(${inner})`;
        }
        CHURCH_NUMERALS[i] = `(${LAMBDA}f.${LAMBDA}x.${inner})`;
    }
}
// Generate Church numerals 0-100 when the module is loaded
generateChurchNumerals();
/**
 * Main transpilation function that converts JS/TS to lambda calculus
 */
function parse(code) {
    try {
        // First determine if it's TypeScript by checking for type annotations
        const isTypeScript = code.includes(':') || code.includes('interface') || code.includes('type ');
        const jsCode = isTypeScript ? transpileTypeScript(code) : code;
        // Parse the JavaScript code using esprima
        const ast = esprima.parseScript(jsCode);
        // Save AST for debugging
        fs.writeFileSync('ast-debug.json', JSON.stringify(ast, null, 2));
        // Find function declarations in the code
        const funcDecl = findFunctionDeclaration(ast);
        if (!funcDecl) {
            throw new Error('No function declaration found in input file');
        }
        // Convert the function to lambda calculus
        return convertFunctionToLambda(funcDecl);
    }
    catch (error) {
        console.error('Failed to transpile to lambda calculus:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
/**
 * Transpile TypeScript to JavaScript
 */
function transpileTypeScript(tsCode) {
    const result = ts.transpileModule(tsCode, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2015,
            removeComments: true
        }
    });
    return result.outputText;
}
/**
 * Find the first function declaration in an AST
 */
function findFunctionDeclaration(ast) {
    for (const node of ast.body) {
        if (node.type === 'FunctionDeclaration') {
            return node;
        }
    }
    return null;
}
/**
 * Convert a function declaration to lambda calculus
 */
function convertFunctionToLambda(func) {
    // Extract parameter names
    const params = func.params.map(param => {
        if (param.type === 'Identifier') {
            return param.name;
        }
        throw new Error(`Unsupported parameter type: ${param.type}`);
    });
    // Variables in scope - all parameters are in scope
    const scope = new Map();
    params.forEach(param => scope.set(param, 0));
    // Process the function body
    const bodyExpr = processBlock(func.body, scope, true);
    // Construct the lambda expression with parameters using standard lambda calculus notation
    // Format: λx.λy.λz.expr with Unicode lambda and dot notation
    const lambdaParams = params.map(param => `λ${param}`).join('.');
    return `${lambdaParams}.${bodyExpr}`;
}
/**
 * Process a block of statements
 */
function processBlock(block, scope, isReturnExpected = false) {
    // For simple functions, we just need the return statement
    const returnStmt = findReturnStatement(block);
    if (isReturnExpected && !returnStmt) {
        throw new Error('No return statement found in function body');
    }
    if (returnStmt && returnStmt.argument) {
        return processExpression(returnStmt.argument, scope);
    }
    // For more complex functions with variable declarations,
    // we would process them here and incorporate them into the lambda calculus
    return ''; // Empty for non-returning blocks
}
/**
 * Find the return statement in a block
 */
function findReturnStatement(block) {
    for (const stmt of block.body) {
        if (stmt.type === 'ReturnStatement') {
            return stmt;
        }
    }
    return null;
}
/**
 * Process an expression to lambda calculus
 */
function processExpression(expr, scope) {
    switch (expr.type) {
        case 'Literal':
            return processLiteral(expr);
        case 'Identifier':
            return processIdentifier(expr, scope);
        case 'BinaryExpression':
            return processBinaryExpression(expr, scope);
        case 'UnaryExpression':
            return processUnaryExpression(expr, scope);
        case 'CallExpression':
            return processCallExpression(expr, scope);
        case 'ConditionalExpression':
            return processConditionalExpression(expr, scope);
        case 'ArrowFunctionExpression':
        case 'FunctionExpression':
            return processFunctionExpression(expr, scope);
        case 'MemberExpression':
            return processMemberExpression(expr, scope);
        default:
            throw new Error(`Unsupported expression type: ${expr.type}`);
    }
}
/**
 * Process a literal value to lambda calculus
 */
function processLiteral(literal) {
    const value = literal.value;
    // Number literals become Church numerals
    if (typeof value === 'number') {
        // For integers, use pre-generated Church numerals
        if (Number.isInteger(value) && value >= 0 && value <= 100) {
            return CHURCH_NUMERALS[value];
        }
        // For other numbers, we need to decompose them
        // For simplicity, we'll approximate decimals
        const approxInt = Math.round(value);
        return CHURCH_NUMERALS[approxInt];
    }
    // Boolean literals
    if (typeof value === 'boolean') {
        // Church encoding: true = λx.λy.x, false = λx.λy.y
        return value
            ? `(${LAMBDA}x.${LAMBDA}y.x)`
            : `(${LAMBDA}x.${LAMBDA}y.y)`;
    }
    // String literals (simplified - not fully implemented)
    if (typeof value === 'string') {
        // For simplicity, we'll represent strings as their first character's code point
        if (value.length > 0) {
            const charCode = value.charCodeAt(0);
            return CHURCH_NUMERALS[charCode];
        }
        return CHURCH_NUMERALS[0]; // Empty string as 0
    }
    // Default fallback for other literals
    return CHURCH_NUMERALS[0];
}
/**
 * Process an identifier to lambda calculus
 */
function processIdentifier(id, scope) {
    const name = id.name;
    // Check if the identifier is in scope
    if (scope.has(name)) {
        return name;
    }
    // For out-of-scope identifiers, this would be a free variable
    // In pure lambda calculus, we can't have free variables
    return name;
}
/**
 * Process a binary expression to lambda calculus
 */
function processBinaryExpression(binExpr, scope) {
    // Cast to ensure type compatibility
    const left = processExpression(binExpr.left, scope);
    const right = processExpression(binExpr.right, scope);
    // Based on the operator, construct the appropriate lambda calculus expression
    switch (binExpr.operator) {
        case '+':
            // Church addition: λm.λn.λf.λx.m f (n f x)
            return `((${LAMBDA}m.${LAMBDA}n.${LAMBDA}f.${LAMBDA}x.m f (n f x)) ${left} ${right})`;
        case '-':
            // Church subtraction (simplified): λm.λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u) m
            return `((${LAMBDA}m.${LAMBDA}n.${LAMBDA}f.${LAMBDA}x.n (${LAMBDA}g.${LAMBDA}h.h (g f)) (${LAMBDA}u.x) (${LAMBDA}u.u)) ${left} ${right})`;
        case '*':
            // Church multiplication: λm.λn.λf.m (n f)
            return `((${LAMBDA}m.${LAMBDA}n.${LAMBDA}f.m (n f)) ${left} ${right})`;
        case '/':
            // Division is tricky in lambda calculus, we'll use a simplified approximation
            // This is more of a placeholder for the real implementation
            return `((${LAMBDA}m.${LAMBDA}n.${LAMBDA}f.${LAMBDA}x.m (${LAMBDA}g.g (n f)) x) ${left} ${right})`;
        // Comparison operators
        case '==':
        case '===':
            // Church equality (simplified): λm.λn.m (λx.n (λy.FALSE) TRUE) TRUE
            return `((${LAMBDA}m.${LAMBDA}n.m (${LAMBDA}x.n (${LAMBDA}y.(${LAMBDA}a.${LAMBDA}b.b)) (${LAMBDA}a.${LAMBDA}b.a)) (${LAMBDA}a.${LAMBDA}b.a)) ${left} ${right})`;
        case '<':
            // Church less-than (simplified)
            return `((${LAMBDA}m.${LAMBDA}n.(${LAMBDA}a.${LAMBDA}b.b) (m (${LAMBDA}x.(${LAMBDA}a.${LAMBDA}b.a)) (n (${LAMBDA}x.(${LAMBDA}a.${LAMBDA}b.b)) (${LAMBDA}a.${LAMBDA}b.a)))) ${left} ${right})`;
        case '<=':
            // Church less-than-or-equal (simplified)
            return `((${LAMBDA}m.${LAMBDA}n.n (${LAMBDA}x.(${LAMBDA}a.${LAMBDA}b.a)) (m (${LAMBDA}x.(${LAMBDA}a.${LAMBDA}b.b)) (${LAMBDA}a.${LAMBDA}b.a))) ${left} ${right})`;
        case '>':
            // Church greater-than (simplified)
            // Implemented as "not less-than-or-equal"
            return `((${LAMBDA}p.${LAMBDA}a.${LAMBDA}b.p b a) ((${LAMBDA}m.${LAMBDA}n.n (${LAMBDA}x.(${LAMBDA}a.${LAMBDA}b.a)) (m (${LAMBDA}x.(${LAMBDA}a.${LAMBDA}b.b)) (${LAMBDA}a.${LAMBDA}b.a))) ${left} ${right}))`;
        case '>=':
            // Church greater-than-or-equal (simplified)
            // Implemented as "not less-than"
            return `((${LAMBDA}p.${LAMBDA}a.${LAMBDA}b.p b a) ((${LAMBDA}m.${LAMBDA}n.(${LAMBDA}a.${LAMBDA}b.b) (m (${LAMBDA}x.(${LAMBDA}a.${LAMBDA}b.a)) (n (${LAMBDA}x.(${LAMBDA}a.${LAMBDA}b.b)) (${LAMBDA}a.${LAMBDA}b.a)))) ${left} ${right}))`;
        // For other operators, we'd need more complex implementations
        // These are just placeholders for basic arithmetic
        default:
            throw new Error(`Unsupported binary operator: ${binExpr.operator}`);
    }
}
/**
 * Process a unary expression to lambda calculus
 */
function processUnaryExpression(unaryExpr, scope) {
    const argument = processExpression(unaryExpr.argument, scope);
    switch (unaryExpr.operator) {
        case '!':
            // Church negation: λp.λa.λb.p b a
            return `((${LAMBDA}p.${LAMBDA}a.${LAMBDA}b.p b a) ${argument})`;
        case '-':
            // Church negation for numbers is complex
            // For simplicity, we'll use a placeholder
            return `((${LAMBDA}n.${LAMBDA}f.${LAMBDA}x.n (${LAMBDA}g.${LAMBDA}h.h (g f)) (${LAMBDA}u.x) (${LAMBDA}u.u)) ${CHURCH_NUMERALS[0]} ${argument})`;
        default:
            throw new Error(`Unsupported unary operator: ${unaryExpr.operator}`);
    }
}
/**
 * Process a call expression to lambda calculus
 */
function processCallExpression(callExpr, scope) {
    // Cast to ensure type compatibility 
    const callee = processExpression(callExpr.callee, scope);
    const args = callExpr.arguments.map(arg => processExpression(arg, scope));
    // In lambda calculus, function application is simply juxtaposition
    // We'll wrap each application in parentheses for clarity
    let result = `(${callee}`;
    for (const arg of args) {
        result += ` ${arg}`;
    }
    result += ')';
    return result;
}
/**
 * Process a conditional expression to lambda calculus
 */
function processConditionalExpression(condExpr, scope) {
    const test = processExpression(condExpr.test, scope);
    const consequent = processExpression(condExpr.consequent, scope);
    const alternate = processExpression(condExpr.alternate, scope);
    // Church if-then-else: λp.λa.λb.p a b
    return `((${LAMBDA}p.${LAMBDA}a.${LAMBDA}b.p a b) ${test} ${consequent} ${alternate})`;
}
/**
 * Process a function expression to lambda calculus
 */
function processFunctionExpression(funcExpr, parentScope) {
    // Extract parameter names
    const params = funcExpr.params.map(param => {
        if (param.type === 'Identifier') {
            return param.name;
        }
        throw new Error(`Unsupported parameter type: ${param.type}`);
    });
    // Create a new scope for the function body
    const scope = new Map(parentScope);
    // Add parameters to the scope
    params.forEach(param => scope.set(param, 0));
    // Process the function body
    let bodyExpr;
    if (funcExpr.type === 'ArrowFunctionExpression' &&
        funcExpr.expression &&
        funcExpr.body.type !== 'BlockStatement') {
        // Arrow function with expression body: x => x + 1
        bodyExpr = processExpression(funcExpr.body, scope);
    }
    else {
        // Function with block body
        const body = funcExpr.body;
        bodyExpr = processBlock(body, scope, true);
    }
    // Construct the lambda abstraction
    const paramStr = params.map(param => `${LAMBDA}${param}`).join('.');
    return `(${paramStr}.${bodyExpr})`;
}
/**
 * Process a member expression (obj.prop) to lambda calculus
 */
function processMemberExpression(memberExpr, scope) {
    const object = processExpression(memberExpr.object, scope);
    // Handle common array methods
    if (memberExpr.property.type === 'Identifier') {
        const propName = memberExpr.property.name;
        // Implementation for common array methods
        switch (propName) {
            case 'map':
                // Create a lambda for the map operation
                // map as a higher-order function in lambda calculus
                return `((${LAMBDA}arr.${LAMBDA}f.arr f) ${object})`;
            case 'filter':
                // Create a lambda for the filter operation
                // filter as a higher-order function in lambda calculus
                return `((${LAMBDA}arr.${LAMBDA}pred.arr (${LAMBDA}x.pred x)) ${object})`;
            default:
                // For other properties, just use a basic access pattern
                // This is a simplified approach
                return `((${LAMBDA}obj.${LAMBDA}prop.obj prop) ${object} (${LAMBDA}x.x))`;
        }
    }
    // For computed properties, try to process the property
    if (memberExpr.computed && memberExpr.property.type) {
        const prop = processExpression(memberExpr.property, scope);
        return `((${LAMBDA}obj.${LAMBDA}prop.obj prop) ${object} ${prop})`;
    }
    throw new Error('Unsupported member expression property type');
}
//# sourceMappingURL=index.js.map