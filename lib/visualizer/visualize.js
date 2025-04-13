/**
 * Lambda calculus visualization using John Tromp diagrams
 */
const fs = require('fs');
const path = require('path');
const { TrompDiagramGenerator } = require('./tromp-diagram');

/**
 * Visualizes a lambda calculus expression as a John Tromp diagram
 */
class LambdaVisualizer {
    constructor(options = {}) {
        this.diagramGenerator = new TrompDiagramGenerator(options);
        this.outputDir = options.outputDir || path.join(process.cwd(), 'diagrams');
    }

    /**
     * Generate a diagram from a lambda calculus expression
     * @param {string} lambdaExpression - The lambda calculus expression to visualize
     * @param {string} outputPath - The path where to save the diagram
     * @param {string} format - The output format ('svg' or 'png')
     * @returns {string} The path to the generated diagram
     */
    visualize(lambdaExpression, outputPath, format = 'svg') {
        try {
            // Ensure output directory exists
            if (!fs.existsSync(path.dirname(outputPath))) {
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            }

            // Generate and save the diagram
            if (format === 'svg') {
                return this.diagramGenerator.saveSVG(lambdaExpression, outputPath);
            } else if (format === 'png') {
                return this.diagramGenerator.savePNG(lambdaExpression, outputPath);
            } else {
                throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error) {
            console.error('Error generating diagram:', error);
            throw error;
        }
    }

    /**
     * Visualize a lambda calculus expression from a file
     * @param {string} inputFile - Path to the file containing lambda expressions
     * @param {string} outputDir - Directory to save the generated diagrams
     * @param {string} format - The output format ('svg' or 'png')
     * @returns {Array<string>} Paths to all generated diagrams
     */
    visualizeFromFile(inputFile, outputDir = this.outputDir, format = 'svg') {
        try {
            // Read the input file
            const content = fs.readFileSync(inputFile, 'utf8');
            
            // Split by line and process each expression
            const expressions = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
            
            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // Generate a diagram for each expression
            const outputPaths = [];
            for (let i = 0; i < expressions.length; i++) {
                const expr = expressions[i];
                const outputPath = path.join(outputDir, `diagram_${i + 1}.${format}`);
                this.visualize(expr, outputPath, format);
                outputPaths.push(outputPath);
            }
            
            return outputPaths;
        } catch (error) {
            console.error('Error processing file:', error);
            throw error;
        }
    }
}

module.exports = { LambdaVisualizer };