/**
 * Lambda calculus parser for Jambda
 * Converts lambda expressions into a syntax tree to support transpilation
 * and visualization.
 */
interface AbstractionTerm {
    type: 'abstraction';
    variable: string;
    body: Term;
}
interface ApplicationTerm {
    type: 'application';
    left: Term;
    right: Term;
}
interface VariableTerm {
    type: 'variable';
    name: string;
}
type Term = AbstractionTerm | ApplicationTerm | VariableTerm;
/**
 * Parser for lambda calculus expressions
 */
export declare class Parser {
    private source;
    private tokens;
    private position;
    private current;
    constructor(source: string);
    /**
     * Break the input string into tokens
     */
    private tokenize;
    /**
     * Advance to the next token
     */
    private advance;
    /**
     * Check if the current token is of the expected type
     */
    private match;
    /**
     * Consume the current token if it's of the expected type
     */
    private consume;
    /**
     * Parse a lambda expression
     */
    parse(): Term;
    /**
     * Parse an expression (abstraction, application, or atomic)
     */
    private parseExpression;
    /**
     * Parse a lambda abstraction (λx.body)
     */
    private parseAbstraction;
    /**
     * Parse an application (func arg)
     */
    private parseApplication;
    /**
     * Parse an atomic expression (variable or parenthesized expression)
     */
    private parseAtomic;
}
export {};
