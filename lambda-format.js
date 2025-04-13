// Lambda Calculus Formatter - Converts to standard mathematical notation
const fs = require('fs');

// Command line arguments for input and output files
const inputFile = process.argv[2] || './lambda-output.txt';
const outputFile = process.argv[3] || './lambda-formatted.txt';

// Parse the lambda expression to a proper mathematical form
function formatLambda(expr) {
  // Clean the input and handle special characters
  expr = expr.replace(/\\/g, 'λ');  // Replace \ with λ
  
  // Check if it's a "let ... in ..." expression
  if (expr.includes('let') && expr.includes('in')) {
    // Handle lambda abstraction at the beginning (if any)
    let prefix = '';
    if (expr.startsWith('λ') || expr.startsWith('->')) {
      const arrowMatch = expr.match(/^(->\s+|λ)/);
      if (arrowMatch) {
        prefix = 'λ';
        expr = expr.substring(arrowMatch[0].length);
      }
    }
    
    // Extract the bindings and body
    const letParts = expr.split(/\s+in\s+/);
    if (letParts.length < 2) {
      return expr; // Malformed let expression
    }
    
    const bindings = letParts[0].replace(/^let\s+/, '').split(/;\s*/);
    const body = letParts[1];
    
    // Format to mathematical lambda calculus with substitutions
    // This converts let x = y in z to (λx.z)y
    let result = body;
    
    // Process bindings from right to left (inner to outer)
    for (let i = bindings.length - 1; i >= 0; i--) {
      const binding = bindings[i];
      const parts = binding.split(/\s*=\s*/);
      if (parts.length < 2) continue; // Skip malformed bindings
      
      const variable = parts[0].trim();
      const value = parts[1].trim();
      
      // Create the lambda abstraction
      result = `(λ${variable}.${result})(${value})`;
    }
    
    return prefix + result;
  }
  
  // For expressions that don't use 'let', just replace syntax
  // First, handle the initial lambda arrow properly
  if (expr.startsWith('->')) {
    expr = expr.substring(2).trim();
  }
  
  // Format rest of the expression
  return expr
    .replace(/->/g, '.')       // Replace -> with .
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .replace(/\(\s+/g, '(')    // Remove space after opening parenthesis
    .replace(/\s+\)/g, ')')    // Remove space before closing parenthesis
    .replace(/\(\+/g, '(+')    // Fix operator spacing
    .replace(/\(\*/g, '(*')
    .replace(/\(\//g, '(/'); 
}

// Main function
function main() {
  try {
    // Read the lambda calculus expression from the input file
    const lambdaExpression = fs.readFileSync(inputFile, 'utf-8').trim();
    
    console.log('Original Lambda Expression:', lambdaExpression);
    const formattedExpr = formatLambda(lambdaExpression);
    console.log('Formatted Lambda Expression:', formattedExpr);
    
    // Write to output file
    fs.writeFileSync(outputFile, formattedExpr, 'utf-8');
    console.log(`Saved formatted expression to ${outputFile}`);
  } catch (err) {
    console.error('Error formatting lambda expression:', err.message);
    process.exit(1);
  }
}

// Run the main function
main();