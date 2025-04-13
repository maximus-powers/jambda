#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { LambdaVisualizer } = require('./lib/visualizer/visualize');

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
    } else if (args[i] === '--output' || args[i] === '-o') {
        outputDir = args[i + 1];
        i++;
    } else if (args[i] === '--format' || args[i] === '-f') {
        format = args[i + 1].toLowerCase();
        i++;
    } else if (args[i] === '--width' || args[i] === '-w') {
        width = parseInt(args[i + 1]);
        i++;
    } else if (args[i] === '--height' || args[i] === '-h') {
        height = parseInt(args[i + 1]);
        i++;
    } else if (args[i] === '--labels' || args[i] === '-l') {
        showLabels = true;
    } else if (args[i] === '--show-app-symbols') {
        hideAppSymbols = false;
    } else if (args[i] === '--hide-app-symbols') {
        hideAppSymbols = true;
    } else if (args[i] === '--help') {
        showHelp();
        process.exit(0);
    }
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

// Validate input file
if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    showHelp();
    process.exit(1);
}

// Set visualization options
const options = {
    outputDir: outputDir,
    unitSize: 12,                   // Much smaller unit size for very complex expressions
    lineWidth: 2,                   // Thinner lines to save space
    padding: 10,                    // Minimal padding to maximize diagram space
    width: width,                   // Set width
    height: height,                 // Set height
    backgroundColor: '#282a36',     // Dark background
    preserveAspectRatio: true,      // Ensure diagram preserves aspect ratio
    
    // Color palette for individual components - high contrast colors
    colors: [
        '#ff5555',                  // Red
        '#8be9fd',                  // Cyan
        '#50fa7b',                  // Green
        '#ffb86c',                  // Orange
        '#bd93f9',                  // Purple
        '#ff79c6',                  // Pink
        '#f1fa8c',                  // Yellow
        '#5af78e',                  // Bright Green
        '#57c7ff',                  // Light Blue
        '#ff6ac1',                  // Bright Pink
        '#e74c3c',                  // Crimson
        '#3498db',                  // Royal Blue
        '#2ecc71',                  // Emerald
        '#e67e22',                  // Carrot
        '#9b59b6',                  // Amethyst
        '#f39c12',                  // Sunflower
        '#1abc9c',                  // Turquoise
        '#d35400',                  // Pumpkin
        '#2980b9',                  // Belize Hole
        '#27ae60'                   // Nephritis
    ],
    
    // Special colors for specific elements
    operatorColor: '#ffb86c',       // Orange for operators (+, -, *, /)
    churchNumeralColor: '#bd93f9',  // Purple for Church numerals
    textColor: '#f8f8f2',           // Light text color
    
    // Label positioning and collision avoidance
    labelPadding: 8,                // Increased padding around labels
    labelOffset: 20,                // Increased offset for variable labels
    labelCollisionOffset: 15,       // Increased offset for collision avoidance
    
    showLabels: showLabels,         // Show labels if enabled
    hideApplicationSymbols: hideAppSymbols // Hide @ symbols
};

// Create visualizer and generate diagrams
try {
    console.log(`Generating diagrams from ${inputFile}...`);
    
    const visualizer = new LambdaVisualizer(options);
    const outputPaths = visualizer.visualizeFromFile(inputFile, outputDir, format);
    
    console.log(`Generated ${outputPaths.length} diagram(s) in ${outputDir}`);
    outputPaths.forEach(path => console.log(` - ${path}`));
} catch (error) {
    console.error('Error generating diagrams:', error.message);
    process.exit(1);
}