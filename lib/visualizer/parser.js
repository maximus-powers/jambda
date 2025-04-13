/**
 * Lambda expression parser for John Tromp diagrams
 * Converts lambda calculus expressions to a parse tree structure
 */

// Token types
const TokenType = {
  LAMBDA: 'LAMBDA',
  DOT: 'DOT',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  VAR: 'VAR',
  EOF: 'EOF'
};

// Parser for lambda calculus expressions
class Parser {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = this.tokenize();
    this.currentToken = 0;
  }

  // Tokenize the input string
  tokenize() {
    const tokens = [];
    
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        this.position++;
        continue;
      }
      
      // Lambda symbol (λ or \)
      if (char === 'λ' || char === '\\') {
        tokens.push({ type: TokenType.LAMBDA, value: 'λ' });
        this.position++;
        continue;
      }
      
      // Dot or period
      if (char === '.' || char === '-') {
        if (char === '-' && this.position + 1 < this.input.length && this.input[this.position + 1] === '>') {
          tokens.push({ type: TokenType.DOT, value: '.' });
          this.position += 2;  // Skip '>'
        } else if (char === '.') {
          tokens.push({ type: TokenType.DOT, value: '.' });
          this.position++;
        } else {
          // Handle as variable if just a single '-'
          const start = this.position;
          while (this.position < this.input.length && 
                 !(/\s/.test(this.input[this.position])) && 
                 !'λ\\().'.includes(this.input[this.position])) {
            this.position++;
          }
          tokens.push({ type: TokenType.VAR, value: this.input.substring(start, this.position) });
        }
        continue;
      }
      
      // Parentheses
      if (char === '(') {
        tokens.push({ type: TokenType.LPAREN, value: '(' });
        this.position++;
        continue;
      }
      
      if (char === ')') {
        tokens.push({ type: TokenType.RPAREN, value: ')' });
        this.position++;
        continue;
      }
      
      // Variables
      if (/[a-zA-Z0-9_]/.test(char)) {
        const start = this.position;
        while (this.position < this.input.length && 
               !(/\s/.test(this.input[this.position])) && 
               !'λ\\().'.includes(this.input[this.position])) {
          this.position++;
        }
        tokens.push({ type: TokenType.VAR, value: this.input.substring(start, this.position) });
        continue;
      }
      
      // Skip any other characters
      this.position++;
    }
    
    tokens.push({ type: TokenType.EOF, value: 'EOF' });
    return tokens;
  }

  // Get current token
  token() {
    return this.tokens[this.currentToken];
  }
  
  // Advance to next token
  advance() {
    this.currentToken++;
    return this.tokens[this.currentToken - 1];
  }
  
  // Check if token is of expected type and advance
  expect(type) {
    if (this.token().type === type) {
      return this.advance();
    }
    throw new Error(`Expected ${type}, got ${this.token().type}`);
  }
  
  // Parse a lambda term
  parseTerm() {
    // Lambda abstraction
    if (this.token().type === TokenType.LAMBDA) {
      this.advance();
      const variable = this.expect(TokenType.VAR).value;
      this.expect(TokenType.DOT);
      const body = this.parseTerm();
      return { type: 'abstraction', variable, body };
    }
    
    // Parse an atomic term or parenthesized expression
    let term = this.parseAtom();
    
    // Application
    while (this.token().type !== TokenType.EOF && 
           this.token().type !== TokenType.RPAREN) {
      const right = this.parseAtom();
      term = { type: 'application', left: term, right };
    }
    
    return term;
  }
  
  // Parse an atom (variable or parenthesized expression)
  parseAtom() {
    if (this.token().type === TokenType.VAR) {
      return { type: 'variable', name: this.advance().value };
    }
    
    if (this.token().type === TokenType.LPAREN) {
      this.advance();
      const term = this.parseTerm();
      this.expect(TokenType.RPAREN);
      return term;
    }
    
    throw new Error(`Unexpected token: ${this.token().type}`);
  }
  
  // Parse the entire lambda expression
  parse() {
    const result = this.parseTerm();
    this.expect(TokenType.EOF);
    return result;
  }
}

module.exports = { Parser };