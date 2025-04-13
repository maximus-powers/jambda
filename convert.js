// convert.js - Converts JavaScript to Lambda Calculus notation
const fs = require('fs');
const jsToLambda = require('./lib');

// If command-line arguments are provided, use the first as input file
const inputFile = process.argv[2] || './input.js';
const outputFile = process.argv[3] || './lambda-parsed.js';

try {
    // Read the input file
    const inputCode = fs.readFileSync(inputFile, 'utf-8');

    // Parse the JavaScript code to lambda calculus
    const lambdaResult = jsToLambda.parse(inputCode);

    // Output the result
    console.log(lambdaResult);

    // Write to file
    fs.writeFileSync(outputFile, lambdaResult, 'utf-8');
    console.log(`Lambda calculus notation written to ${outputFile}`);
} catch (error) {
    console.error('Error converting JavaScript to Lambda Calculus:', error.message);
    process.exit(1);
}