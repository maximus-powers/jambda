# Jambda - JavaScript to Lambda Calculus Converter

Jambda is a tool that converts JavaScript functions to Lambda Calculus notation. It parses JavaScript code and generates equivalent lambda calculus expressions with proper mathematical notation.

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

## Installation

```bash
# Clone the repository (or download it)
git clone https://github.com/yourusername/jambda.git
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
- `lib/` - Contains the core conversion logic:
  - `index.js` - Entry point for the converter
  - `body-parser.js` - Parses function bodies
  - `function-parser.js` - Parses function declarations
  - `operators.js` - Handles mathematical operations
  - `node-parser.js` - Parses AST nodes
  - `return-parser.js` - Parses return statements

## Limitations

- Does not handle all JavaScript features (loops, conditionals, objects)
- Arithmetic operations are represented as function applications, not true lambda calculus encodings
- Does not perform beta/eta reductions on the output

## License

MIT License

## Acknowledgements

Based on the js-to-lambda library with custom extensions to handle Math functions and formatting.