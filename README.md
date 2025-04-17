# Jambda-calc

Convert JavaScript/TypeScript functions to lambda calculus notation and visualize them.

[![npm version](https://img.shields.io/npm/v/jambda-calc.svg)](https://www.npmjs.com/package/jambda-calc)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

Jambda-calc is a toolkit for converting JavaScript functions to lambda calculus notation and creating visual representations of the resulting expressions. It helps bridge the gap between practical programming and the mathematical foundations of computation.

## Features

- **Transpile** JavaScript functions to lambda calculus notation
- **Visualize** lambda expressions as ASCII art in the terminal or as SVG/PNG diagrams
- **Use as a CLI tool** or integrate into your projects as a library
- **Support** for basic JavaScript syntax including functions, arithmetic operations, and conditionals

## Installation

```bash
# Global installation (for CLI usage)
npm install -g jambda-calc

# Local installation (for project usage)
npm install jambda-calc

# Or using pnpm
pnpm add jambda-calc
```

## CLI Usage

After installing the package, you can use the CLI commands:

### Basic Transpilation

Convert a JavaScript function to lambda calculus notation:

```bash
# Basic transpilation (outputs to console)
jambda --input path/to/function.js

# Save output to a file
jambda --input path/to/function.js --output output.lambda.txt
```

### Visualization

Generate a visual representation of your lambda expression:

```bash
# ASCII visualization in terminal
jambda --input path/to/function.js --visualize

# Generate SVG diagram
jambda --input path/to/function.js --visualize --output-dir diagrams

# Generate PNG diagram
jambda --input path/to/function.js --visualize --output-dir diagrams --format png
```

### Individual CLI Tools

Jambda also provides separate commands for transpilation and visualization:

```bash
# Transpile only
jambda-transpile --input path/to/function.js --output output.lambda.txt

# Visualize only (from lambda calculus file)
jambda-visualize --input output.lambda.txt --output diagrams --format svg
```

### CLI Options

```
Main tool (jambda) options:
  --input, -i       Input JavaScript/TypeScript file
  --output, -o      Output lambda expression file (optional)
  --visualize, -v   Visualize the lambda expression
  --output-dir      Output directory for diagram files (if not provided, displays ASCII in console)
  --format, -f      Output format for diagrams: svg (default) or png
  --width, -w       Width of the diagram in pixels (default: 1200)
  --height, -h      Height of the diagram in pixels (default: 800)
  --labels, -l      Show term labels in the diagram
  --hide-app-symbols Hide application (@) symbols (default)
  --show-app-symbols Show application (@) symbols
  --debug           Save debug information
  --help            Show help message
```

## Programmatic Usage

You can use Jambda-calc in your code for more advanced integration:

### Transpilation

```javascript
const { parse } = require('jambda-calc');
// Or using ESM imports
// import { parse } from 'jambda-calc';

// JavaScript code to transpile
const jsCode = `
function add(a, b) {
  return a + b;
}`;

// Convert to lambda calculus
const lambdaExpression = parse(jsCode);
console.log(lambdaExpression);
```

### Visualization

```javascript
const { parse } = require('jambda-calc');
const { LambdaVisualizer, renderSVGAsASCII } = require('jambda-calc/dist/lib/visualizer');
// Or using ESM imports
// import { parse } from 'jambda-calc';
// import { LambdaVisualizer, renderSVGAsASCII } from 'jambda-calc/dist/lib/visualizer';

// JavaScript code to transpile
const jsCode = `
function add(a, b) {
  return a + b;
}`;

// Convert to lambda calculus
const lambdaExpression = parse(jsCode);

// Create a visualizer
const visualizer = new LambdaVisualizer({
  // Optional configuration
  unitSize: 12,
  backgroundColor: '#282a36',
  showLabels: true
});

// Generate SVG visualization
const svgContent = visualizer.visualize(lambdaExpression);

// For ASCII visualization in terminal
const asciiArt = renderSVGAsASCII(svgContent);
console.log(asciiArt);
```

## Examples

### Simple Addition Function

JavaScript function:

```javascript
function add(a, b) {
  return a + b;
}
```

Lambda calculus notation:

```
λa.λb.(+ a b)
```

### Celsius to Fahrenheit Conversion

JavaScript function:

```javascript
function celsiusToFahrenheit(c) {
  return (c * 9/5) + 32;
}
```

Lambda calculus notation:

```
λc.(+ (* c (/ 9 5)) 32)
```

## Visualization Examples

Jambda can generate lambda calculus visualizations in multiple formats:

### ASCII Art (in terminal)

When running the visualization without an output directory, you'll see an ASCII representation in the console:

```
      λ                λ
      |                |
      c                a
      |                |
      +                λ
     / \               |
    /   \              b
   *     32            |
  / \                  +
 c   /                / \
    / \              a   b
   9   5
```

### SVG/PNG Diagrams

For more complex expressions, Jambda generates SVG/PNG diagrams with color-coded nodes for better readability when you specify an output directory.

## Customizing Visualization

When using the visualizer programmatically, you can customize the output:

```javascript
const visualizer = new LambdaVisualizer({
  // Sizing
  unitSize: 14,
  lineWidth: 2,
  padding: 20,
  width: 1200, 
  height: 800,
  
  // Colors
  backgroundColor: '#282a36',
  colors: ['#ff5555', '#8be9fd', '#50fa7b', '#ffb86c', '#bd93f9'],
  textColor: '#f8f8f2',
  
  // Special element colors
  operatorColor: '#ffb86c',
  churchNumeralColor: '#bd93f9',
  
  // Options
  showLabels: true,
  hideApplicationSymbols: true,
  preserveAspectRatio: true
});
```

## Limitations

- Currently supports a subset of JavaScript syntax
- Complex expressions with many nested functions may generate large visualizations
- Some JavaScript constructs don't have direct lambda calculus equivalents

## Running Examples

The package includes several example functions you can run:

```bash
# Run all examples
npm run examples

# Run specific examples
npm run example:add
npm run example:celsius
```

## Development

```bash
# Clone the repository
git clone https://github.com/maximuspowers/jambda.git
cd jambda

# Install dependencies
npm install
# or using pnpm
pnpm install

# Build the project
npm run build

# Run linting
npm run lint
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.