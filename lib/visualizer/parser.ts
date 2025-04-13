/**
 * Lambda calculus parser for Jambda
 * Converts lambda expressions into a syntax tree to support transpilation 
 * and visualization.
 */

// Token definitions
enum TokenType {
  LAMBDA = 'lambda',
  DOT = 'dot',
  VARIABLE = 'variable',
  LPAREN = 'lparen',
  RPAREN = 'rparen',
  EOF = 'eof'
}

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

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
export class Parser {
  private source: string;
  private tokens: Token[];
  private position: number;
  private current: Token;

  constructor(source: string) {
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
  private tokenize(): void {
    let pos = 0;
    
    while (pos < this.source.length) {
      const char = this.source[pos];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        pos++;
        continue;
      }
      
      // Lambda character (λ or \)
      if (char === 'λ' || char === '\\') {
        this.tokens.push({ type: TokenType.LAMBDA, value: 'λ', pos });
        pos++;
        continue;
      }
      
      // Dot or arrow
      if (char === '.' || (char === '-' && pos + 1 < this.source.length && this.source[pos + 1] === '>')) {
        this.tokens.push({ type: TokenType.DOT, value: '.', pos });
        // Skip two characters for arrow notation
        pos += (char === '-') ? 2 : 1;
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
      
      // Variables - allow alphanumeric plus some special characters
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
    
    // Add EOF token
    this.tokens.push({ type: TokenType.EOF, value: '', pos });
  }

  /**
   * Advance to the next token
   */
  private advance(): void {
    if (this.position < this.tokens.length) {
      this.current = this.tokens[this.position++];
    }
  }

  /**
   * Check if the current token is of the expected type
   */
  private match(type: TokenType): boolean {
    return this.current.type === type;
  }

  /**
   * Consume the current token if it's of the expected type
   */
  private consume(type: TokenType, errorMessage: string): Token {
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
  parse(): Term {
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
  private parseExpression(): Term {
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
  private parseAbstraction(): Term {
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
  private parseApplication(): Term {
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
  private parseAtomic(): Term {
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