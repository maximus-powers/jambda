#!/usr/bin/env node

/**
 * Script to run all examples, display their source code, lambda expression output,
 * and visualize them with ASCII art in the console.
 */
// eslint-disable-next-line
const fs = require('fs');
// eslint-disable-next-line
const path = require('path');
// eslint-disable-next-line
const { execSync } = require('child_process');

// Define the examples to run
const examples = [
  {
    name: 'Example 1: Addition',
    file: 'add.js',
    description: 'Adds two numbers together using lambda calculus'
  },
  {
    name: 'Example 2: Celsius to Fahrenheit',
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
  // eslint-disable-next-line
  console.log(`\n${colors.bright}${colors.blue}==== ${text} =====${colors.reset}\n`);
}

// Helper function to print source code
function printSourceCode(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  // eslint-disable-next-line
  console.log(`${colors.green}Source Code:${colors.reset}`);
  // eslint-disable-next-line
  console.log(`${colors.cyan}${source}${colors.reset}`);
}

// Main function
async function runExamples() {
  printHeader('JAMBDA EXAMPLES');
  
  for (const example of examples) {
    printHeader(example.name);
    
    // eslint-disable-next-line
    const exampleFile = path.join(__dirname, example.file);
    
    printSourceCode(exampleFile);
    
    try {
      const cmd = `pnpm run start --input "${exampleFile}" --visualize`;
      
      execSync(cmd, { 
        stdio: 'inherit'
      });
    } catch (error) {
      // eslint-disable-next-line
      console.error(`Error running example: ${error.message}`);
    }

  }
  
  printHeader('ALL EXAMPLES COMPLETED');
}

// eslint-disable-next-line
runExamples().catch(console.error);