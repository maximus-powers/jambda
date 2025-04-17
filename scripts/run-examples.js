#!/usr/bin/env node

/**
 * Script to run all examples, display their source code, lambda expression output,
 * and open their PNG visualizations.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parse } = require('../dist/lib/transpiler/index');

// Define the examples to run
const examples = [
  {
    name: 'Addition',
    file: 'add.js',
    description: 'Adds two numbers together using lambda calculus'
  },
  {
    name: 'Celsius to Fahrenheit',
    file: 'celsius-to-fahrenheit.js',
    description: 'Converts Celsius to Fahrenheit temperatures'
  }
];

// Terminal colors for better output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

// Helper function to print headers
function printHeader(text) {
  console.log(`\n${colors.bright}${colors.blue}==== ${text} =====${colors.reset}\n`);
}

// Helper function to print source code
function printSourceCode(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  console.log(`${colors.green}Source Code:${colors.reset}`);
  console.log(`${colors.cyan}${source}${colors.reset}`);
}

// Main function
async function runExamples() {
  printHeader('JAMBDA EXAMPLES');
  
  for (const example of examples) {
    printHeader(example.name);
    console.log(example.description);
    
    const exampleFile = path.join(__dirname, '..', 'examples', example.file);
    // Use a temporary file in the system temp directory for lambda expression
    const outputFile = path.join(require('os').tmpdir(), `${path.basename(example.file, path.extname(example.file))}.lambda.txt`);
    
    // Print source code
    printSourceCode(exampleFile);
    
    // Run the example (transpile and visualize)
    try {
      // Run the CLI command without output-dir to show ASCII diagram in console
      execSync(`node dist/bin/jambda.js --input "${exampleFile}" --output "${outputFile}" --visualize`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch (error) {
      console.error(`Error running example: ${error.message}`);
    }
    
    // Add a pause between examples
    console.log('\nContinuing to next example in 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  printHeader('ALL EXAMPLES COMPLETED');
}

// Run the examples
runExamples().catch(console.error);