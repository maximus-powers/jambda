# Jambda - JavaScript to Lambda Calculus Converter and Visualizer

Jambda is a tool that converts JavaScript/TypeScript functions to Lambda Calculus notation and visualizes them as John Tromp diagrams. It parses JavaScript code, generates equivalent lambda calculus expressions, and creates visualizations to help understand the functional structure.

## Features

- Converts JavaScript/TypeScript functions to lambda calculus notation
- Supports various JavaScript constructs:
  - Function declarations and expressions
  - Variable declarations and references
  - Basic arithmetic operations (+, -, *, /)
  - Conditional expressions (ternary)
  - Arrow functions
  - Simple nested functions and scopes
- Formats output in standard mathematical lambda calculus notation
- Visualizes lambda expressions as authentic John Tromp diagrams (SVG and PNG formats)
  - High-resolution diagrams with dark background
  - ASCII art visualization for terminal display
  - Proper visualization of lambda abstractions, variables, and applications

## Installation

### From npm (coming soon)

```bash
# Install globally
npm install -g jambda

# Or install as a dev dependency in your project
npm install --save-dev jambda
```

### From Source

```bash
# Clone the repository
git clone https://github.com/maximuspowers/jambda.git
cd jambda

# Install dependencies
npm install
# or if you prefer pnpm
pnpm install

# Build the project
npm run build
```

## Usage

### Command Line Interface

#### Transpile a JavaScript file to lambda calculus

```bash
# Using the global command
jambda-transpile --input example.js --output lambda.txt

# Or if installed locally
npx jambda-transpile --input example.js --output lambda.txt
```

#### Visualize a lambda calculus expression

```bash
# Using the global command
jambda-visualize --input lambda.txt --output diagrams --format svg --labels

# Or if installed locally
npx jambda-visualize --input lambda.txt --output diagrams --format svg --labels
```

#### Transpile and visualize in one step

```bash
# Using the global command
jambda --input example.js --output lambda.txt --visualize --output-dir diagrams

# Or if installed locally
npx jambda --input example.js --output lambda.txt --visualize --output-dir diagrams

# Display ASCII art diagram in terminal
jambda --input example.js --output lambda.txt --visualize
```

### CLI Options

#### For `jambda-transpile`

```
Options:
  --input, -i     Input file (default: input.js)
  --output, -o    Output lambda expressions file (default: lambda-formatted.txt)
  --debug, -d     Save debug information (default: false)
  --help          Show this help message
```

#### For `jambda-visualize`

```
Options:
  --input, -i     Input file path containing lambda expressions (default: lambda-formatted.txt)
  --output, -o    Output directory for diagrams (default: diagrams)
  --format, -f    Output format: svg (default) or png
  --width, -w     Width of the output image in pixels (default: 1200)
  --height, -h    Height of the output image in pixels (default: 800)
  --labels, -l    Show term labels in the diagram
  --hide-app-symbols  Hide application (@) symbols (default)
  --show-app-symbols  Show application (@) symbols
  --help          Show this help message
```

#### For `jambda` (combined tool)

```
Options:
  --input, -i       Input JavaScript/TypeScript file (default: input.js)
  --output, -o      Output lambda expression file (default: lambda-formatted.txt)
  --visualize, -v   Also visualize the lambda expression (default: false)
  --output-dir      Output directory for diagrams (if not provided, displays in terminal)
  --format, -f      Output format for diagrams: svg (default) or png
  --width, -w       Width of the diagram in pixels (default: 1200)
  --height, -h      Height of the diagram in pixels (default: 800)
  --labels, -l      Show term labels in the diagram
  --hide-app-symbols Hide application (@) symbols (default)
  --show-app-symbols Show application (@) symbols
  --debug           Save debug information
  --help            Show this help message
```

### JavaScript API

You can also use Jambda as a library in your JavaScript/TypeScript projects:

```javascript
// ESM
import { transpile, LambdaVisualizer, jambda } from 'jambda';

// CommonJS
const { transpile, LambdaVisualizer, jambda } = require('jambda');

// Transpile a JavaScript/TypeScript function to lambda calculus
const jsCode = `
function add(a, b) {
  return a + b;
}`;

// Option 1: Using the named export
const lambdaExpr = transpile(jsCode);
console.log(lambdaExpr); // λa.λb.(((λm.λn.λf.λx.m f (n f x)) a) b)

// Option 2: Using the jambda object
const lambdaExpr2 = jambda.transpile(jsCode);

// Visualize a lambda expression and save it to a file
const outputPath = './diagram.svg';
jambda.visualize(lambdaExpr, outputPath, {
  showLabels: true,
  width: 1200,
  height: 800
});

// Or transpile and visualize in one step
jambda.transpileAndVisualize(jsCode, outputPath, {
  showLabels: true
});

// Use the LambdaVisualizer class directly for more control
const visualizer = new LambdaVisualizer({
  showLabels: true, 
  backgroundColor: '#282a36'
});
visualizer.visualize(lambdaExpr, outputPath, 'svg');

// Generate ASCII art diagram for console output
const asciiArt = jambda.generateAsciiDiagram(lambdaExpr);
console.log(asciiArt);
```

## Examples

### Identity Function

```javascript
function identity(x) {
    return x;
}
```

Lambda calculus notation:
```
λx.x
```

### Church Numeral 2

```javascript
function church2(f) {
    return function(x) {
        return f(f(x));
    };
}
```

Lambda calculus notation:
```
λf.λx.(f (f x))
```

### Addition Function

```javascript
function add(a, b) {
    return a + b;
}
```

Lambda calculus notation:
```
λa.λb.(((λm.λn.λf.λx.m f (n f x)) a) b)
```

## How It Works

1. The JavaScript/TypeScript code is parsed to an AST using esprima
2. The AST is traversed and converted into lambda calculus expressions
3. The lambda expressions are formatted into standard notation (using λ symbol and proper parenthesization)
4. For visualization, the lambda expression is parsed again and rendered as a John Tromp diagram

## Project Structure

- `src/` - Contains the TypeScript source code
  - `index.ts` - Main entry point for the library
  - `bin/` - Command-line executables
    - `transpile.ts` - CLI for transpilation
    - `visualize.ts` - CLI for visualization
    - `jambda.ts` - Combined CLI
  - `lib/` - Core library code
    - `transpiler/` - Contains the transpilation logic
      - `index.ts` - Main transpiler API
      - `body-parser.ts` - Parses function bodies
      - `function-parser.ts` - Parses function definitions
      - `keywords.ts` - Handles JavaScript keywords
      - `node-parser.ts` - Parses AST nodes
      - `operators.ts` - Implements operators in lambda calculus
      - `return-parser.ts` - Processes return statements
    - `visualizer/` - Contains the visualization logic
      - `index.ts` - Main visualizer API
      - `tromp-diagram.ts` - Generates John Tromp diagrams
      - `ascii-renderer.ts` - Renders SVG diagrams as ASCII art
      - `parser.ts` - Parses lambda expressions for visualization

## Limitations

- Does not handle all JavaScript features (loops, advanced conditionals, objects, classes)
- Arithmetic operations are represented using Church encodings which may be complex to read
- Very complex expressions may result in extremely large diagrams

## Development

The repository is organized as follows:

- `src/` - Contains the TypeScript source code
- `examples/` - Contains example JS/TS functions for testing
- `diagrams/` - Default output directory for generated diagrams

To contribute to the project:

```bash
# Clone the repository
git clone https://github.com/yourusername/jambda.git
cd jambda

# Install dependencies
npm install
# or if you prefer pnpm
pnpm install

# Build the project
npm run build

# Run the example
npm run example
npm run example:vis
```

## License

MIT License

## Acknowledgements

- Based on concepts from various lambda calculus implementations
- John Tromp diagrams are based on the visual representation of lambda calculus developed by John Tromp