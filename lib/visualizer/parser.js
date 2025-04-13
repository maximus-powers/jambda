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
      
      // Check for lambda arrow notation (-> or →)
      if (char === '-' && this.position + 1 < this.input.length && this.input[this.position + 1] === '>') {
        // Skip the arrow notation, it's just syntax sugar
        this.position += 2;
        continue;
      }
      
      // Lambda symbol (λ or \)
      if (char === 'λ' || char === '\\') {
        tokens.push({ type: TokenType.LAMBDA, value: 'λ' });
        this.position++;
        
        // Skip any identifier before the dot in case of '\identifier -> expr' format
        let nextPos = this.position;
        while (nextPos < this.input.length && 
               /[a-zA-Z0-9_]/.test(this.input[nextPos])) {
          nextPos++;
        }
        
        // If we found an identifier and it's followed by an arrow, skip it
        if (nextPos > this.position) {
          // Extract the variable name
          const variable = this.input.substring(this.position, nextPos);
          tokens.push({ type: TokenType.VAR, value: variable });
          this.position = nextPos;
        }
        
        continue;
      }
      
      // Dot or period
      if (char === '.') {
        tokens.push({ type: TokenType.DOT, value: '.' });
        this.position++;
        continue;
      }
      
      // Handle minus sign (could be part of an identifier)
      if (char === '-') {
        // Already handled arrow above, so this must be a simple minus in a variable
        const start = this.position;
        while (this.position < this.input.length && 
               !(/\s/.test(this.input[this.position])) && 
               !'λ\\().'.includes(this.input[this.position])) {
          this.position++;
        }
        tokens.push({ type: TokenType.VAR, value: this.input.substring(start, this.position) });
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
      
      // Check if the next token is a variable, as required for a lambda abstraction
      if (this.token().type !== TokenType.VAR) {
        // Handle missing variable name (can happen in some lambda calculus notations)
        // Use a default variable name like 'x'
        console.warn('Missing variable name in lambda abstraction, using default name "x"');
        const variable = 'x';
        
        // Still need a dot
        if (this.token().type === TokenType.DOT) {
          this.advance();
        } else {
          console.warn('Missing dot after lambda, assuming it was intended');
          // Continue without consuming a token
        }
        
        const body = this.parseTerm();
        return { type: 'abstraction', variable, body };
      }
      
      // Normal case: variable is present
      const variable = this.advance().value;
      
      // Check for and consume the dot
      if (this.token().type === TokenType.DOT) {
        this.advance();
      } else {
        console.warn('Missing dot after variable in lambda abstraction, assuming it was intended');
        // Continue without consuming a token
      }
      
      const body = this.parseTerm();
      return { type: 'abstraction', variable, body };
    }
    
    // Parse an atomic term or parenthesized expression
    let term = this.parseAtom();
    
    // Application
    while (this.token().type !== TokenType.EOF && 
           this.token().type !== TokenType.RPAREN) {
      try {
        // Use a try-catch here to handle errors in complex applications
        const right = this.parseAtom();
        term = { type: 'application', left: term, right };
      } catch (error) {
        console.warn(`Skipping problematic application: ${error.message}`);
        
        // Try to recover by advancing the token
        if (this.token().type !== TokenType.EOF && 
            this.token().type !== TokenType.RPAREN) {
          this.advance();
        } else {
          break; // Can't recover, exit the loop
        }
      }
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
      
      try {
        const term = this.parseTerm();
        
        // Check for closing parenthesis, but be more forgiving
        if (this.token().type === TokenType.RPAREN) {
          this.advance();
        } else {
          console.warn(`Missing closing parenthesis, assuming it was intended. Found ${this.token().type} instead.`);
          // Continue without consuming a token - recovering strategy
        }
        
        return term;
      } catch (error) {
        // More aggressive recovery for nested expressions
        console.warn(`Error parsing parenthesized expression: ${error.message}`);
        
        // Create a placeholder variable as a recovery mechanism
        console.warn('Creating placeholder variable as recovery');
        return { type: 'variable', name: 'error_recovery' };
      }
    }
    
    // Last resort - create a dummy node to continue parsing
    console.warn(`Unexpected token: ${this.token().type}. Creating dummy node to continue parsing.`);
    this.advance(); // Skip the unexpected token
    return { type: 'variable', name: 'error_recovery' };
  }
  
  // Parse the entire lambda expression
  parse() {
    try {
      const result = this.parseTerm();
      this.expect(TokenType.EOF);
      return result;
    } catch (error) {
      console.error('Error parsing lambda expression:', error.message);
      console.error('Expression:', this.input);
      console.error('Token position:', this.currentToken);
      console.error('Tokens:', JSON.stringify(this.tokens, null, 2));
      
      // For debugging - print first few tokens
      console.error('First 10 tokens:');
      for (let i = 0; i < Math.min(10, this.tokens.length); i++) {
        console.error(`  ${i}: ${this.tokens[i].type} - ${this.tokens[i].value}`);
      }
      
      throw new Error(`Lambda expression parsing failed: ${error.message}`);
    }
  }
}

module.exports = { Parser };