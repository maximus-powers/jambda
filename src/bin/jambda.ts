#!/usr/bin/env node

/**
 * Main command-line tool for Jambda - combines transpilation and visualization
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { parse } from '../lib/transpiler';
import { LambdaVisualizer, renderSVGAsASCII } from '../lib/visualizer';

// Parse command line arguments
const args = process.argv.slice(2);

let inputFile = './input.js';
let outputFile = './lambda-formatted.txt';
let outputDir: string | null = null;
let format = 'svg';
let visualize = false;
let saveDebug = false;

// Visualization options
let showLabels = false;
let hideAppSymbols = true; // Hide @ application symbols by default
let width = 1200;
let height = 800;

function showHelp(): void {
    console.log('Usage: jambda [options]');
    console.log('');
    console.log('Options:');
    console.log('  --input, -i       Input JavaScript/TypeScript file (default: input.js)');
    console.log('  --output, -o      Output lambda expression file (default: lambda-formatted.txt)');
    console.log('  --visualize, -v   Also visualize the lambda expression (default: false)');
    console.log('  --output-dir      Output directory for diagram files (if not provided, displays in console)');
    console.log('  --format, -f      Output format for diagrams: svg (default) or png');
    console.log('  --width, -w       Width of the diagram in pixels (default: 1200)');
    console.log('  --height, -h      Height of the diagram in pixels (default: 800)');
    console.log('  --labels, -l      Show term labels in the diagram');
    console.log('  --hide-app-symbols Hide application (@) symbols (default)');
    console.log('  --show-app-symbols Show application (@) symbols');
    console.log('  --debug           Save debug information');
    console.log('  --help            Show this help message');
}

// Parse arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
        if (i + 1 < args.length) {
            inputFile = args[i + 1];
            i++;
        }
    } else if (args[i] === '--output' || args[i] === '-o') {
        if (i + 1 < args.length) {
            outputFile = args[i + 1];
            i++;
        }
    } else if (args[i] === '--visualize' || args[i] === '-v') {
        visualize = true;
    } else if (args[i] === '--output-dir') {
        if (i + 1 < args.length) {
            outputDir = args[i + 1];
            i++;
        }
    } else if (args[i] === '--format' || args[i] === '-f') {
        if (i + 1 < args.length) {
            format = args[i + 1].toLowerCase();
            i++;
        }
    } else if (args[i] === '--width' || args[i] === '-w') {
        if (i + 1 < args.length) {
            width = parseInt(args[i + 1]);
            i++;
        }
    } else if (args[i] === '--height') {
        if (i + 1 < args.length) {
            height = parseInt(args[i + 1]);
            i++;
        }
    } else if (args[i] === '--labels' || args[i] === '-l') {
        showLabels = true;
    } else if (args[i] === '--show-app-symbols') {
        hideAppSymbols = false;
    } else if (args[i] === '--hide-app-symbols') {
        hideAppSymbols = true;
    } else if (args[i] === '--debug') {
        saveDebug = true;
    } else if (args[i] === '--help') {
        showHelp();
        process.exit(0);
    }
}

// Terminal colors for better output formatting
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    purple: '\x1b[35m',
    yellow: '\x1b[33m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

// Main function
async function main(): Promise<void> {
    try {
        // 1. Transpile the input file
        
        // Make sure the output directory exists
        const outputFileDir = path.dirname(outputFile);
        if (!fs.existsSync(outputFileDir)) {
            fs.mkdirSync(outputFileDir, { recursive: true });
        }
        
        // Read the input file
        console.log(`${colors.gray}Reading input file: ${inputFile}${colors.reset}`);
        const inputCode = fs.readFileSync(inputFile, 'utf-8');
        
        // Transpile to lambda calculus
        console.log(`${colors.gray}Transpiling to lambda calculus...${colors.reset}`);
        const lambdaExpression = parse(inputCode);
        
        // Save debug information if requested
        if (saveDebug) {
            fs.writeFileSync('lambda-debug.txt', lambdaExpression, 'utf-8');
            console.log(`${colors.gray}Debug info saved to lambda-debug.txt${colors.reset}`);
        }
        
        // Write to file
        fs.writeFileSync(outputFile, lambdaExpression, 'utf-8');
        console.log(`${colors.gray}Lambda calculus notation written to ${outputFile}${colors.reset}`);
        
        // Display the lambda expression in color
        console.log(`\n${colors.bright}${colors.purple}λ Expression:${colors.reset} ${colors.purple}${lambdaExpression.replace(/\\/g, 'λ').replace(/->/g, '.').replace(/\(\(([^()]*)\)\)/g, '($1)')}${colors.reset}\n`);
        
        // 2. Visualize if requested
        if (visualize) {
            console.log(`${colors.gray}Visualizing lambda expression...${colors.reset}`);
            
            // Set visualization options
            const options = {
                outputDir: outputDir === null ? undefined : outputDir, // Pass undefined when outputDir is null
                unitSize: 12,                // Much smaller unit size for complex expressions
                lineWidth: 2,                // Thinner lines to save space
                padding: 10,                 // Minimal padding to maximize diagram space
                width: width,                // Set width
                height: height,              // Set height
                backgroundColor: '#282a36',  // Dark background
                preserveAspectRatio: true,   // Ensure diagram preserves aspect ratio
                
                // Colors setup
                colors: [
                    '#ff5555', '#8be9fd', '#50fa7b', '#ffb86c', '#bd93f9',
                    '#ff79c6', '#f1fa8c', '#5af78e', '#57c7ff', '#ff6ac1',
                    '#e74c3c', '#3498db', '#2ecc71', '#e67e22', '#9b59b6'
                ],
                
                // Special colors for specific elements
                operatorColor: '#ffb86c',      // Orange for operators
                churchNumeralColor: '#bd93f9', // Purple for Church numerals
                textColor: '#f8f8f2',          // Light text color
                
                // Label positioning
                labelPadding: 8,
                labelOffset: 20,
                labelCollisionOffset: 15,
                
                showLabels: showLabels,
                hideApplicationSymbols: hideAppSymbols
            };
            
            // Normalize lambda expression
            const normalizedExpression = lambdaExpression.replace(/\\/g, 'λ')
                                                      .replace(/->/g, '.')
                                                      .replace(/\(\(([^()]*)\)\)/g, '($1)');
            
            // Create visualizer with proper options
            const visualizer = new LambdaVisualizer({
                ...options,
                // Make sure outputDir is undefined if not provided
                outputDir: undefined
            });
            
            // Get SVG content directly from visualizer
            const svgContent = visualizer.visualize(normalizedExpression);
            
            // If output directory is provided, save to file
            if (outputDir) {
                // Ensure diagram output directory exists
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                // Get file name from input for meaningful diagram name
                const baseName = path.basename(inputFile, path.extname(inputFile));
                
                // Create output path
                const outputPath = path.join(outputDir, `${baseName}.${format}`);
                
                // Save the SVG to file
                if (format === 'svg') {
                    fs.writeFileSync(outputPath, svgContent);
                    console.log(`${colors.gray}Generated diagram: ${outputPath}${colors.reset}`);
                } else if (format === 'png') {
                    // For PNG, we need to use the visualizer to convert SVG to PNG
                    const tempSvgPath = path.join(outputDir, `${baseName}.svg`);
                    fs.writeFileSync(tempSvgPath, svgContent);
                    
                    // Use sharp to convert SVG to PNG
                    // Handle ESM/CommonJS compatibility with sharp module
                    const sharpFn = ((sharp as unknown) as { default?: typeof sharp }).default || sharp;
                    sharpFn(Buffer.from(svgContent))
                        .png()
                        .toFile(outputPath)
                        .then(() => {
                            console.log(`${colors.gray}Generated PNG diagram: ${outputPath}${colors.reset}`);
                        })
                        .catch((err: Error) => {
                            console.error(`${colors.red}Error converting SVG to PNG:${colors.reset}`, err);
                        });
                }
            } else {
                // No output directory specified, display the diagram as ASCII art
                console.log(`\n${colors.bright}${colors.white}[Lambda Expression Diagram - ASCII]${colors.reset}`);
                console.log("");
                
                try {
                    // Generate the ASCII diagram using the imported renderSVGAsASCII function
                    const asciiDiagram = renderSVGAsASCII(svgContent);
                    console.log(colors.white + asciiDiagram + colors.reset);
                    console.log(`\n${colors.yellow}Note: Use --output-dir to save a graphical SVG/PNG version.${colors.reset}`);
                } catch (err) {
                    console.error(`${colors.red}Error rendering ASCII diagram:${colors.reset}`, err);
                    console.log(`${colors.yellow}Use --output-dir to save a graphical SVG/PNG version.${colors.reset}`);
                }
            }
        }
        
        // End silently without 'Done!' message
    } catch (error) {
        console.error(`${colors.red}Error:${colors.reset}`, error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();