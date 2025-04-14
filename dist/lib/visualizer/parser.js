"use strict";
/**
 * Lambda calculus parser for Jambda
 * Converts lambda expressions into a syntax tree to support transpilation
 * and visualization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
// Token definitions
var TokenType;
(function (TokenType) {
    TokenType["LAMBDA"] = "lambda";
    TokenType["DOT"] = "dot";
    TokenType["VARIABLE"] = "variable";
    TokenType["LPAREN"] = "lparen";
    TokenType["RPAREN"] = "rparen";
    TokenType["EOF"] = "eof";
})(TokenType || (TokenType = {}));
/**
 * Parser for lambda calculus expressions
 */
class Parser {
    constructor(source) {
        this.source = source;
        this.tokens = [];
        this.position = 0;
        this.current = { type: TokenType.EOF, value: '', pos: 0 };
        this.tokenize();
        this.advance();
    }
    /**
     * Break the input string into tokens
     */
    tokenize() {
        // Safety check for empty source
        if (!this.source || this.source.length === 0) {
            this.tokens.push({ type: TokenType.EOF, value: '', pos: 0 });
            return;
        }
        // Limit the source length to prevent memory issues
        const maxSourceLength = 100000; // 100K characters max
        const trimmedSource = this.source.length > maxSourceLength ?
            this.source.substring(0, maxSourceLength) :
            this.source;
        let pos = 0;
        while (pos < trimmedSource.length) {
            const char = trimmedSource[pos];
            // Skip whitespace
            if (/\s/.test(char)) {
                pos++;
                continue;
            }
            // Lambda character (λ)
            if (char === 'λ') {
                this.tokens.push({ type: TokenType.LAMBDA, value: 'λ', pos });
                pos++;
                continue;
            }
            // Dot or arrow
            if (char === '.') {
                this.tokens.push({ type: TokenType.DOT, value: '.', pos });
                pos++;
                continue;
            }
            // Parentheses
            if (char === '(') {
                this.tokens.push({ type: TokenType.LPAREN, value: '(', pos });
                pos++;
                continue;
            }
            if (char === ')') {
                this.tokens.push({ type: TokenType.RPAREN, value: ')', pos });
                pos++;
                continue;
            }
            // Variables - can be alphanumeric or some special characters
            if (/[a-zA-Z0-9_'+*\-/]/.test(char)) {
                let value = '';
                const startPos = pos;
                while (pos < this.source.length && /[a-zA-Z0-9_'+*\-/]/.test(this.source[pos])) {
                    value += this.source[pos];
                    pos++;
                }
                this.tokens.push({ type: TokenType.VARIABLE, value, pos: startPos });
                continue;
            }
            // Skip any other character (including comments and other non-lambda syntax)
            pos++;
        }
        this.tokens.push({ type: TokenType.EOF, value: '', pos });
    }
    /**
     * Advance to the next token
     */
    advance() {
        if (this.position < this.tokens.length) {
            this.current = this.tokens[this.position++];
        }
    }
    /**
     * Check if the current token is of the expected type
     */
    match(type) {
        return this.current.type === type;
    }
    /**
     * Consume the current token if it's of the expected type
     */
    consume(type, errorMessage) {
        if (this.match(type)) {
            const token = this.current;
            this.advance();
            return token;
        }
        throw new Error(`${errorMessage} at position ${this.current.pos}`);
    }
    /**
     * Parse a lambda expression
     */
    parse() {
        // Removing extra parentheses from the expression
        const term = this.parseExpression();
        if (!this.match(TokenType.EOF)) {
            throw new Error(`Unexpected token ${this.current.type} at position ${this.current.pos}`);
        }
        return term;
    }
    /**
     * Parse an expression (abstraction, application, or atomic)
     */
    parseExpression() {
        // Lambda abstraction
        if (this.match(TokenType.LAMBDA)) {
            return this.parseAbstraction();
        }
        // Start with an atomic expression, then check for application
        return this.parseApplication();
    }
    /**
     * Parse a lambda abstraction (λx.body)
     */
    parseAbstraction() {
        // Consume lambda symbol
        this.consume(TokenType.LAMBDA, "Expected lambda");
        // Variable name
        const variable = this.consume(TokenType.VARIABLE, "Expected variable after lambda").value;
        // Dot separator
        this.consume(TokenType.DOT, "Expected dot after variable in lambda abstraction");
        // Body expression
        const body = this.parseExpression();
        return {
            type: 'abstraction',
            variable,
            body
        };
    }
    /**
     * Parse an application (func arg)
     */
    parseApplication() {
        // Start with an atomic term
        let term = this.parseAtomic();
        // Keep applying terms as long as we have more atomic terms
        // (applications are left-associative)
        while (!this.match(TokenType.EOF) && !this.match(TokenType.RPAREN) &&
            !this.match(TokenType.DOT)) {
            // The next term is the argument
            const argument = this.parseAtomic();
            // Create application node
            term = {
                type: 'application',
                left: term,
                right: argument
            };
        }
        return term;
    }
    /**
     * Parse an atomic expression (variable or parenthesized expression)
     */
    parseAtomic() {
        // Variable
        if (this.match(TokenType.VARIABLE)) {
            const name = this.current.value;
            this.advance();
            return { type: 'variable', name };
        }
        // Parenthesized expression
        if (this.match(TokenType.LPAREN)) {
            this.advance(); // Consume left paren
            const expr = this.parseExpression();
            this.consume(TokenType.RPAREN, "Expected closing parenthesis");
            return expr;
        }
        throw new Error(`Unexpected token ${this.current.type} at position ${this.current.pos}`);
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map