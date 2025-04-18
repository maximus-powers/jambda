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
 * Parser for lambda calculus expressions.
 */
export declare class Parser {
    private source;
    private tokens;
    private position;
    private current;
    constructor(source: string);
    private tokenize;
    private advance;
    private match;
    private consume;
    /**
     * Parse a lambda expression. Converts formal lambda calc into AST for rendering.
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
