"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// convert.ts - Converts JavaScript to Lambda Calculus notation
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_1 = require("./lib/transpiler/index");
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
    }
    else if (args[i] === '--output' || args[i] === '-o') {
        if (i + 1 < args.length) {
            outputFile = args[i + 1];
            i++;
        }
    }
    else if (args[i] === '--help') {
        console.log('Usage: npx ts-node convert.ts [options]');
        console.log('');
        console.log('Options:');
        console.log('  --input, -i     Input file (default: input.js)');
        console.log('  --output, -o    Output lambda expressions file (default: lambda-formatted.txt)');
        console.log('  --help          Show this help message');
        process.exit(0);
    }
}
try {
    // Make sure the output directory exists
    const outputDir = path_1.default.dirname(outputFile);
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    // Read the input file
    const inputCode = fs_1.default.readFileSync(inputFile, 'utf-8');
    // Use our transpiler to convert code to lambda calculus
    const lambdaExpression = (0, index_1.parse)(inputCode);
    // Also generate a version that we can check in the debugger
    fs_1.default.writeFileSync('lambda-debug.txt', lambdaExpression, 'utf-8');
    // Log the successful transpilation
    console.log("Successfully transpiled to lambda calculus expression");
    // Write to file
    fs_1.default.writeFileSync(outputFile, lambdaExpression, 'utf-8');
    console.log(`Lambda calculus notation written to ${outputFile}`);
}
catch (error) {
    console.error('Error converting to Lambda Calculus:', error instanceof Error ? error.message : String(error));
    process.exit(1);
}
//# sourceMappingURL=convert.js.map