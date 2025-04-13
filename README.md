# Jambda - JavaScript to Lambda Calculus Converter

Jambda is a tool that converts JavaScript functions to Lambda Calculus notation. It parses JavaScript code and generates equivalent lambda calculus expressions with proper mathematical notation and visualizes them as John Tromp diagrams.

## Features

- Converts JavaScript functions to lambda calculus notation
- Supports various JavaScript constructs:
  - Function declarations and expressions
  - Variable declarations and references
  - Basic arithmetic operations (+, -, *, /)
  - Math object methods (Math.cos, Math.sin, Math.sqrt, etc.)
  - Math constants (Math.PI)
  - Nested functions and scopes
- Formats output in standard mathematical lambda calculus notation
- Visualizes lambda expressions as authentic John Tromp diagrams (SVG and PNG formats)
  - High-resolution diagrams with dark background
  - Rich color-coded diagram elements:
    - Red lines for lambda abstractions (λ)
    - Green lines for variables
    - Operator-specific colors:
      - Cyan for addition (+)
      - Purple for subtraction (-)
      - Orange for multiplication (*)
      - Yellow for division (/)
      - Pink for math functions
      - Blue-gray for general applications
  - Color-matched term labels for improved readability:
    - Variable names in green
    - Lambda abstractions with variable names in red
    - Operation symbols in their respective colors
    - Numeric constants fully expanded as Church numerals with distinctive purple coloring

## Installation

```bash
# Clone the repository (or download it)
git clone https://github.com/maximuspowers/jambda.git
cd jambda

# Install dependencies
npm install
# or if you prefer pnpm
pnpm install
```

## Usage

### Basic Usage

The easiest way to convert a JavaScript function to formatted lambda calculus is to use the provided shell script:

```bash
# Make the script executable first
chmod +x convert-and-format.sh

# Run the conversion
./convert-and-format.sh [input-file] [output-file]
```

If no arguments are provided, it reads from `input.js` and outputs to `lambda-formatted.txt`.

### Visualization

To generate John Tromp diagrams from lambda calculus expressions:

```bash
# Make the script executable first
chmod +x convert-and-visualize.sh

# Convert JavaScript to lambda calculus and generate diagrams
./convert-and-visualize.sh [input-file] [output-dir] [format]
```

If no arguments are provided, it reads from `input.js`, generates lambda calculus, and outputs diagrams to the `diagrams` directory in SVG format.

You can also run the visualizer directly on lambda calculus expressions:

```bash
node visualize.js --input lambda-formatted.txt --output diagrams --format svg --style standard
```

Options:
- `--input, -i`: Input file path containing lambda expressions (default: lambda-formatted.txt)
- `--output, -o`: Output directory for diagrams (default: diagrams)
- `--format, -f`: Output format: svg (default) or png
- `--width, -w`: Width of the diagram in pixels (default: 1200)
- `--height`: Height of the diagram in pixels (default: 800)
- `--labels, -l`: Show term labels in the diagram
- `--show-app-symbols`: Show application (@) symbols in the diagram
- `--hide-app-symbols`: Hide application (@) symbols (default)

### Manual Usage

You can also run the conversion steps manually:

1. Convert JavaScript to lambda calculus:

```bash
node convert.js [input-file] [output-file]
```

2. Format the lambda expression:

```bash
# First, copy the output to the expected input file
cp lambda-parsed.js lambda-output.txt

# Then format it
node lambda-format.js [input-file] [output-file]
```

### Run Example Functions

Run all the example functions through the converter:

```bash
node run-examples.js
```

This processes several example functions and saves the results to individual files (e.g., `identity_lambda.txt`).

### Custom Input and Output Files

You can specify custom input and output files:

```bash
# For the converter
node convert.js path/to/input.js path/to/output.js

# For the formatter
node lambda-format.js path/to/input.txt path/to/output.txt
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
λx . x
```

### Church Numeral 2

```javascript
function church2() {
    return function(f) {
        return function(x) {
            return f(f(x));
        };
    };
}
```

Lambda calculus notation:
```
λf . λx . f (f x)
```

### Celsius to Fahrenheit

```javascript
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}
```

Lambda calculus notation:
```
λcelsius . (+ (* celsius (/ 9 5)) 32)
```

### Math Function Usage

```javascript
function cosDegrees(angle) {
    const radians = angle * Math.PI / 180;
    return Math.cos(radians);
}
```

Lambda calculus notation:
```
λangle . (λradians . cos radians)(* angle (/ pi 180))
```

## How It Works

1. The JavaScript code is parsed to an AST (Abstract Syntax Tree) using UglifyJS
2. Custom parsers traverse the AST and convert different node types to lambda calculus:
   - Function declarations become lambda abstractions (λx.body)
   - Variable references become variable names
   - Function calls become function applications
   - Binary operations (+, -, *, /) become operator applications
   - Math methods become function applications
3. The formatter converts the notation to standard mathematical lambda calculus

## Project Structure

- `convert.js` - Main conversion script
- `lambda-format.js` - Formatter for lambda calculus notation
- `run-examples.js` - Runs multiple examples
- `visualize.js` - Generates John Tromp diagrams from lambda expressions
- `convert-and-format.sh` - Script to convert JS to formatted lambda calculus
- `convert-and-visualize.sh` - Script to convert JS and generate diagrams
- `lib/` - Contains the core conversion logic:
  - `index.js` - Entry point for the converter
  - `body-parser.js` - Parses function bodies
  - `function-parser.js` - Parses function declarations
  - `operators.js` - Handles mathematical operations
  - `node-parser.js` - Parses AST nodes
  - `return-parser.js` - Parses return statements
  - `visualizer/` - Contains diagram generation logic:
    - `parser.js` - Parses lambda expressions into AST
    - `tromp-diagram.js` - Generates authentic John Tromp diagrams
    - `visualize.js` - Main visualization module

## Limitations

- Does not handle all JavaScript features (loops, conditionals, objects)
- Arithmetic operations are represented as function applications, not true lambda calculus encodings
- Does not perform beta/eta reductions on the output
- Visualizer does not handle extremely complex lambda expressions well

## License

MIT License

## Acknowledgements

Based on the js-to-lambda library with custom extensions to handle Math functions and formatting.

John Tromp diagrams are based on the visual representation of lambda calculus developed by John Tromp. More information can be found in his paper "Functional Diagrams for Supercombinator Compilation".