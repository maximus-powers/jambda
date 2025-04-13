// convert.js - Converts JavaScript to Lambda Calculus notation
const fs = require('fs');
const path = require('path');
const jsToLambda = require('./lib/transpiler/index');

// Parse command line arguments
const args = process.argv.slice(2);
let inputFile = './input.js';
let outputFile = './lambda-formatted.txt';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
        if (i + 1 < args.length) {
            inputFile = args[i + 1];
            i++;
        }
    } else if (args[i] === '--output' || args[i] === '-o') {
        if (i + 1 < args.length) {
            outputFile = args[i + 1];
            i++;
        }
    } else if (args[i] === '--help') {
        console.log('Usage: node convert.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --input, -i     Input JavaScript file (default: input.js)');
        console.log('  --output, -o    Output lambda expressions file (default: lambda-formatted.txt)');
        console.log('  --help          Show this help message');
        process.exit(0);
    }
}

try {
    // Make sure the output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Read the input file
    const inputCode = fs.readFileSync(inputFile, 'utf-8');

    // Parse the JavaScript code to lambda calculus
    const lambdaResult = jsToLambda.parse(inputCode);

    // Write to file
    fs.writeFileSync(outputFile, lambdaResult, 'utf-8');
    console.log(`Lambda calculus notation written to ${outputFile}`);
} catch (error) {
    console.error('Error converting JavaScript to Lambda Calculus:', error.message);
    process.exit(1);
}