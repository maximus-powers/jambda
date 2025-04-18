#!/usr/bin/env node

// eslint-disable-next-line
const fs = require('fs');
// eslint-disable-next-line
const path = require('path');
// eslint-disable-next-line
const { execSync } = require('child_process');

const examples = [
  {
    name: 'Example 1: Addition',
    file: 'add.js',
  },
  {
    name: 'Example 2: Celsius to Fahrenheit',
    file: 'celsius-to-fahrenheit.js',
  },
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

function printSourceCode(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  // eslint-disable-next-line
  console.log(`${colors.green}Source Code:${colors.reset}`);
  // eslint-disable-next-line
  console.log(`${colors.cyan}${source}${colors.reset}`);
}

async function runExamples() {
  // eslint-disable-next-line
  console.log(`\n${colors.bright}${colors.blue}==== JAMBDA EXAMPLES =====${colors.reset}\n`);
  for (const example of examples) {
    // eslint-disable-next-line
    console.log(`\n${colors.bright}${colors.blue}==== ${example.name} =====${colors.reset}\n`);
    // eslint-disable-next-line
    const exampleFile = path.join(__dirname, example.file);

    printSourceCode(exampleFile);

    try {
      /* global process */
      const isNpx = process.env.npm_lifecycle_event === undefined;
      const cmd = isNpx
        ? `node "${path.join(path.dirname(process.argv[1]), '../../bin/jambda.js')}" --input "${exampleFile}" --visualize`
        : `pnpm run start --input "${exampleFile}" --transpile --visualize`;

      execSync(cmd, {
        stdio: 'inherit',
      });
    } catch (error) {
      // eslint-disable-next-line
      console.error(`Error running example: ${error.message}`);
    }
  }
  // eslint-disable-next-line
  console.log(`\n${colors.bright}${colors.blue}==== COMPLETED =====${colors.reset}\n`);
}

// eslint-disable-next-line
runExamples().catch(console.error);
