#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaVisualizer = void 0;
/**
 * Lambda calculus visualization using John Tromp diagrams
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tromp_diagram_1 = require("./tromp-diagram");
/**
 * Visualizes a lambda calculus expression as a John Tromp diagram
 */
class LambdaVisualizer {
    constructor(options = {}) {
        this.diagramGenerator = new tromp_diagram_1.TrompDiagramGenerator(options);
        // If outputDir is explicitly undefined, don't set a default
        if (options.outputDir === undefined) {
            this.outputDir = undefined;
        }
        else {
            this.outputDir = options.outputDir || path_1.default.join(process.cwd(), 'diagrams');
        }
    }
    /**
     * Generate a diagram from a lambda calculus expression
     * @param lambdaExpression - The lambda calculus expression to visualize
     * @param outputPath - The path where to save the diagram (optional)
     * @param format - The output format ('svg' or 'png')
     * @returns The path to the generated diagram or SVG string if no outputPath
     */
    visualize(lambdaExpression, outputPath, format = 'svg') {
        try {
            // If no outputPath is provided, return the SVG string directly
            if (!outputPath) {
                // Only SVG can be returned as a string
                return this.diagramGenerator.generateDiagram(lambdaExpression);
            }
            // Ensure output directory exists
            if (!fs_1.default.existsSync(path_1.default.dirname(outputPath))) {
                fs_1.default.mkdirSync(path_1.default.dirname(outputPath), { recursive: true });
            }
            // Generate and save the diagram
            if (format === 'svg') {
                return this.diagramGenerator.saveSVG(lambdaExpression, outputPath);
            }
            else if (format === 'png') {
                return this.diagramGenerator.savePNG(lambdaExpression, outputPath);
            }
            else {
                throw new Error(`Unsupported format: ${format}`);
            }
        }
        catch (error) {
            console.error('Error generating diagram:', error);
            throw error;
        }
    }
    /**
     * Visualize a lambda calculus expression from a file
     * @param inputFile - Path to the file containing lambda expressions
     * @param outputDir - Directory to save the generated diagrams
     * @param format - The output format ('svg' or 'png')
     * @returns Paths to all generated diagrams
     */
    visualizeFromFile(inputFile, outputDir = this.outputDir, format = 'svg') {
        try {
            // Read the input file
            const content = fs_1.default.readFileSync(inputFile, 'utf8');
            // Split by line and process each expression
            const expressions = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
            // If output directory is undefined or empty, just return SVG strings
            if (!outputDir) {
                console.log("No output directory provided, will return SVG content only");
                return expressions.map(expr => this.visualize(expr));
            }
            // Ensure output directory exists
            if (!fs_1.default.existsSync(outputDir)) {
                fs_1.default.mkdirSync(outputDir, { recursive: true });
            }
            // Generate a diagram for each expression
            const outputPaths = [];
            for (let i = 0; i < expressions.length; i++) {
                const expr = expressions[i];
                const outputPath = path_1.default.join(outputDir, `diagram_${i + 1}.${format}`);
                this.visualize(expr, outputPath, format);
                outputPaths.push(outputPath);
            }
            return outputPaths;
        }
        catch (error) {
            console.error('Error processing file:', error);
            throw error;
        }
    }
}
exports.LambdaVisualizer = LambdaVisualizer;
// Direct execution support
if (require.main === module) {
    // Command line utils
    mainCLI();
}
// Display usage information
function showHelp() {
    console.log('Usage: node visualize.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --input, -i     Input file path containing lambda expressions (default: lambda-formatted.txt)');
    console.log('  --output, -o    Output directory for diagrams (default: diagrams)');
    console.log('  --format, -f    Output format: svg (default) or png');
    console.log('  --width, -w     Width of the output image in pixels (default: 1200)');
    console.log('  --height        Height of the output image in pixels (default: 800)');
    console.log('  --labels, -l    Show term labels in the diagram');
    console.log('  --hide-app-symbols  Hide application (@) symbols (default)');
    console.log('  --show-app-symbols  Show application (@) symbols');
    console.log('  --help          Show this help message');
}
// Read the lambda expressions from the file and normalize them
function normalizeLambdaExpressions(filePath) {
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf8');
        // For our specific use case, since we know the output format, 
        // use a simpler approach: just use the content as-is initially
        const expressions = [content.trim()];
        // Alternative approach: manually normalize the most common lambda calculus format
        // to make it compatible with the parser
        const manuallyNormalizedExpressions = expressions.map(expr => {
            // Convert to standard lambda calculus notation
            let normalized = expr;
            // Replace backslash lambda with Unicode lambda
            normalized = normalized.replace(/\\/g, 'λ');
            // Replace any remaining arrow notation with dots
            normalized = normalized.replace(/->/g, '.');
            // Remove all parentheses that aren't needed for direct application
            // This is a simplification to match the parser's expectations
            normalized = normalized.replace(/\(\(([^()]*)\)\)/g, '($1)');
            console.log(`Normalized expression (length: ${normalized.length}):`);
            console.log(normalized.substring(0, 50) + '...');
            return normalized;
        });
        return manuallyNormalizedExpressions;
    }
    catch (error) {
        console.error(`Error reading or normalizing file: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}
// Main CLI function for when the module is run directly
function mainCLI() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let inputFile = 'lambda-formatted.txt';
    let outputDir = 'diagrams';
    let format = 'svg';
    // Add options
    let showLabels = false;
    let hideAppSymbols = true; // Hide @ application symbols by default
    let width = 1200;
    let height = 800;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' || args[i] === '-i') {
            inputFile = args[i + 1];
            i++;
        }
        else if (args[i] === '--output' || args[i] === '-o') {
            outputDir = args[i + 1];
            i++;
        }
        else if (args[i] === '--format' || args[i] === '-f') {
            format = args[i + 1].toLowerCase();
            i++;
        }
        else if (args[i] === '--width' || args[i] === '-w') {
            width = parseInt(args[i + 1]);
            i++;
        }
        else if (args[i] === '--height' || args[i] === '-h') {
            height = parseInt(args[i + 1]);
            i++;
        }
        else if (args[i] === '--labels' || args[i] === '-l') {
            showLabels = true;
        }
        else if (args[i] === '--show-app-symbols') {
            hideAppSymbols = false;
        }
        else if (args[i] === '--hide-app-symbols') {
            hideAppSymbols = true;
        }
        else if (args[i] === '--help') {
            showHelp();
            process.exit(0);
        }
    }
    // Validate input file
    if (!fs_1.default.existsSync(inputFile)) {
        console.error(`Error: Input file not found: ${inputFile}`);
        showHelp();
        process.exit(1);
    }
    // Set visualization options
    const options = {
        outputDir: outputDir,
        unitSize: 12, // Much smaller unit size for very complex expressions
        lineWidth: 2, // Thinner lines to save space
        padding: 10, // Minimal padding to maximize diagram space
        width: width, // Set width
        height: height, // Set height
        backgroundColor: '#282a36', // Dark background
        preserveAspectRatio: true, // Ensure diagram preserves aspect ratio
        // Color palette for individual components - high contrast colors
        colors: [
            '#ff5555', // Red
            '#8be9fd', // Cyan
            '#50fa7b', // Green
            '#ffb86c', // Orange
            '#bd93f9', // Purple
            '#ff79c6', // Pink
            '#f1fa8c', // Yellow
            '#5af78e', // Bright Green
            '#57c7ff', // Light Blue
            '#ff6ac1', // Bright Pink
            '#e74c3c', // Crimson
            '#3498db', // Royal Blue
            '#2ecc71', // Emerald
            '#e67e22', // Carrot
            '#9b59b6', // Amethyst
            '#f39c12', // Sunflower
            '#1abc9c', // Turquoise
            '#d35400', // Pumpkin
            '#2980b9', // Belize Hole
            '#27ae60' // Nephritis
        ],
        // Special colors for specific elements
        operatorColor: '#ffb86c', // Orange for operators (+, -, *, /)
        churchNumeralColor: '#bd93f9', // Purple for Church numerals
        textColor: '#f8f8f2', // Light text color
        // Label positioning and collision avoidance
        labelPadding: 8, // Increased padding around labels
        labelOffset: 20, // Increased offset for variable labels
        labelCollisionOffset: 15, // Increased offset for collision avoidance
        showLabels: showLabels, // Show labels if enabled
        hideApplicationSymbols: hideAppSymbols // Hide @ symbols
    };
    // Create visualizer and generate diagrams
    try {
        console.log(`Generating diagrams from ${inputFile}...`);
        // Get normalized expressions
        const expressions = normalizeLambdaExpressions(inputFile);
        if (expressions.length === 0) {
            console.error('No valid lambda expressions found in the input file.');
            process.exit(1);
        }
        // Ensure output directory exists
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const visualizer = new LambdaVisualizer(options);
        const outputPaths = [];
        // Process each expression individually
        for (let i = 0; i < expressions.length; i++) {
            const expr = expressions[i];
            const outputPath = path_1.default.join(outputDir, `diagram_${i + 1}.${format}`);
            try {
                console.log(`Generating diagram for expression ${i + 1}...`);
                visualizer.visualize(expr, outputPath, format);
                outputPaths.push(outputPath);
                console.log(`  → Generated ${outputPath}`);
            }
            catch (error) {
                console.error(`Error generating diagram for expression ${i + 1}:`, error instanceof Error ? error.message : String(error));
                console.error(`  → Expression: ${expr}`);
                // Continue with next expression
            }
        }
        console.log(`Generated ${outputPaths.length} diagram(s) in ${outputDir}`);
        outputPaths.forEach(path => console.log(` - ${path}`));
    }
    catch (error) {
        console.error('Error generating diagrams:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
//# sourceMappingURL=visualize.js.map