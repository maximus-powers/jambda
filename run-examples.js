// run-examples.js - Runs multiple examples through the JS to Lambda Calculus converter
const fs = require('fs');
const { execSync } = require('child_process');

// Function to run a single example
function runExample(name, code) {
  console.log(`\n=== Processing ${name} ===`);
  
  // Create a temporary file with the example code
  const tempFile = './temp-example.js';
  fs.writeFileSync(tempFile, code);
  
  try {
    // Run the converter
    console.log("Converting to lambda calculus...");
    execSync(`node convert.js ${tempFile} ./lambda-parsed.js`);
    
    // Copy to lambda-output.txt for formatting
    fs.copyFileSync('./lambda-parsed.js', './lambda-output.txt');
    
    // Format the result
    console.log("Formatting to mathematical notation...");
    execSync('node lambda-format.js ./lambda-output.txt ./lambda-formatted.txt');
    
    // Read and display the result
    const original = fs.readFileSync(tempFile, 'utf-8');
    const result = fs.readFileSync('./lambda-formatted.txt', 'utf-8');
    
    console.log(`\nOriginal function:\n${original}\n`);
    console.log(`Lambda calculus form:\n${result}\n`);
    
    // Save to example-specific file
    const outputFile = `./${name}_lambda.txt`;
    fs.writeFileSync(outputFile, result);
    console.log(`Saved to ${outputFile}`);
    
  } catch (error) {
    console.error(`Error processing ${name}:`, error.message);
  }
}

// Examples to run
const examples = [
  {
    name: 'identity',
    code: `function identity(x) {
    return x;
}`
  },
  {
    name: 'church2',
    code: `function church2() {
    return function(f) {
        return function(x) {
            return f(f(x));
        };
    };
}`
  },
  {
    name: 'celsiusToFahrenheit',
    code: `function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}`
  },
  {
    name: 'cosDegrees',
    code: `function cosDegrees(angle) {
    // Convert degrees to radians and compute cosine
    const radians = angle * Math.PI / 180;
    return Math.cos(radians);
}`
  },
  {
    name: 'distance',
    code: `function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}`
  },
  {
    name: 'compoundInterest',
    code: `function compoundInterest(principal, rate, time, n) {
    // A = P(1 + r/n)^(nt)
    return principal * Math.pow(1 + rate/n, n * time);
}`
  }
];

// Main function
async function main() {
  console.log("Running examples through JS to Lambda Calculus converter\n");
  
  // Process each example
  for (const example of examples) {
    runExample(example.name, example.code);
  }
  
  // Clean up temp file
  if (fs.existsSync('./temp-example.js')) {
    fs.unlinkSync('./temp-example.js');
  }
  
  console.log("\nAll examples completed!");
}

// Run the script
main().catch(console.error);