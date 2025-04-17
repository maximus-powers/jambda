#!/usr/bin/env node

/**
 * Command-line tool for transpiling JavaScript/TypeScript to lambda calculus
 */
import fs from 'fs';
import path from 'path';
import { parse } from '../lib/transpiler/index';

// Parse command line arguments
const args = process.argv.slice(2);
let inputFile = './input.js';
let outputFile = './lambda-formatted.txt';
let saveDebug = false;

function showHelp(): void {
    console.log('Usage: jambda-transpile [options]');
    console.log('');
    console.log('Options:');
    console.log('  --input, -i     Input file (default: input.js)');
    console.log('  --output, -o    Output lambda expressions file (default: lambda-formatted.txt)');
    console.log('  --debug, -d     Save debug information (default: false)');
    console.log('  --help          Show this help message');
}

// Parse command line arguments
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
    } else if (args[i] === '--debug' || args[i] === '-d') {
        saveDebug = true;
    } else if (args[i] === '--help') {
        showHelp();
        process.exit(0);
    }
}

// Main function
async function main(): Promise<void> {
    try {
        // Make sure the output directory exists
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Read the input file
        const inputCode = fs.readFileSync(inputFile, 'utf-8');
        
        // Use our transpiler to convert code to lambda calculus
        const lambdaExpression = parse(inputCode);

        // Save debug information if requested
        if (saveDebug) {
            fs.writeFileSync('lambda-debug.txt', lambdaExpression, 'utf-8');
            console.log("Debug info saved to lambda-debug.txt");
        }
        
        // Write to file
        fs.writeFileSync(outputFile, lambdaExpression, 'utf-8');
        console.log(`Lambda calculus notation written to ${outputFile}`);
    } catch (error) {
        console.error('Error converting to Lambda Calculus:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();