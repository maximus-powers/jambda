/**
 * Improved John Tromp Lambda Diagram Generator
 * Creates more accurate SVG diagrams from lambda calculus terms
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Parser } = require('./parser');
const { LambdaTree, Variable, Lambda, Application } = require('./lambda-tree');

class ImprovedDiagramGenerator {
    constructor(options = {}) {
        this.options = {
            unitWidth: options.unitWidth || 30,
            unitHeight: options.unitHeight || 30,
            lineWidth: options.lineWidth || 2,
            padding: options.padding || 40,
            strokeColor: options.strokeColor || '#000',
            backgroundColor: options.backgroundColor || '#fff',
            variableColor: options.variableColor || '#0066cc',
            lambdaColor: options.lambdaColor || '#cc0000',
            applicationColor: options.applicationColor || '#006600'
        };
        
        // Diagram construction parameters
        this.svgContent = '';
        this.xOffset = 0;
        this.yOffset = 0;
        this.positions = new Map(); // Store node positions
        this.width = 0;
        this.height = 0;
        this.nodeCounter = 0;
    }

    /**
     * Generate a new unique ID for elements
     */
    generateId() {
        return `node_${this.nodeCounter++}`;
    }

    /**
     * Generate diagram from a lambda expression string
     */
    generateDiagram(lambdaExpression) {
        // Parse the lambda expression
        const parser = new Parser(lambdaExpression);
        const parsedTerm = parser.parse();
        
        // Build a lambda tree
        const lambdaTree = new LambdaTree();
        const root = lambdaTree.process(parsedTerm);
        
        // Calculate dimensions and initialize SVG
        this.calculateDimensions(root);
        
        // Create the SVG container
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" style="background-color:${this.options.backgroundColor}">`;
        
        // Add a rectangle background
        svg += `<rect width="${this.width}" height="${this.height}" fill="${this.options.backgroundColor}" />`;
        
        // Draw the diagram
        this.xOffset = this.options.padding;
        this.yOffset = this.options.padding;
        svg += this.drawTree(root);
        
        // Close the SVG tag
        svg += '</svg>';
        
        return svg;
    }

    /**
     * Calculate the dimensions needed for the diagram
     */
    calculateDimensions(node) {
        if (!node) return { width: 0, height: 0 };
        
        // Calculate width and height based on node type
        if (node instanceof Variable) {
            this.width = this.options.unitWidth * 4;
            this.height = this.options.unitHeight * 4;
        } else if (node instanceof Lambda) {
            const bodyDims = this.calculateDimensions(node.body);
            this.width = Math.max(this.width, bodyDims.width + this.options.unitWidth * 2);
            this.height = Math.max(this.height, bodyDims.height + this.options.unitHeight * 2);
        } else if (node instanceof Application) {
            const leftDims = this.calculateDimensions(node.left);
            const rightDims = this.calculateDimensions(node.right);
            this.width = Math.max(this.width, leftDims.width + rightDims.width + this.options.unitWidth * 3);
            this.height = Math.max(this.height, Math.max(leftDims.height, rightDims.height) + this.options.unitHeight * 2);
        }
        
        // Add padding
        this.width += this.options.padding * 2;
        this.height += this.options.padding * 2;
        
        return { width: this.width, height: this.height };
    }

    /**
     * Draw the lambda tree recursively
     */
    drawTree(node, level = 0) {
        if (!node) return '';
        
        let svg = '';
        const id = this.generateId();
        
        if (node instanceof Variable) {
            // Draw variable (dot)
            const x = this.xOffset + this.options.unitWidth;
            const y = this.yOffset + level * this.options.unitHeight;
            
            svg += `<circle id="${id}" cx="${x}" cy="${y}" r="${this.options.lineWidth * 2}" fill="${this.options.variableColor}" />`;
            
            // Store position for references
            this.positions.set(node, { x, y, id });
            
            // Draw connection to binding lambda if this is a bound variable
            const bindingLambda = this.findBindingLambda(node);
            if (bindingLambda) {
                const lambdaPos = this.positions.get(bindingLambda);
                if (lambdaPos) {
                    svg += this.drawLine(x, y, lambdaPos.x, lambdaPos.y, this.options.variableColor);
                }
            }
            
            this.xOffset += this.options.unitWidth * 2;
            
        } else if (node instanceof Lambda) {
            // Draw lambda (horizontal line)
            const x = this.xOffset;
            const y = this.yOffset + level * this.options.unitHeight;
            const lambdaWidth = this.options.unitWidth * 3;
            
            svg += `<line id="${id}" x1="${x}" y1="${y}" x2="${x + lambdaWidth}" y2="${y}" 
                stroke="${this.options.lambdaColor}" stroke-width="${this.options.lineWidth}" />`;
            
            // Store position for references
            this.positions.set(node, { x, y, id });
            
            // Draw the body of the lambda
            this.xOffset += this.options.unitWidth;
            svg += this.drawTree(node.body, level + 1);
            
        } else if (node instanceof Application) {
            // Draw application (connector between terms)
            const leftX = this.xOffset;
            const y = this.yOffset + level * this.options.unitHeight;
            
            // Draw left term
            const leftSvg = this.drawTree(node.left, level + 1);
            
            // Save current position after drawing left term
            const rightStartX = this.xOffset;
            
            // Draw right term
            const rightSvg = this.drawTree(node.right, level + 1);
            
            // Draw application arc connecting both terms
            const rightX = rightStartX + this.options.unitWidth;
            svg += `<path id="${id}" d="M ${leftX} ${y} C ${leftX + this.options.unitWidth} ${y - this.options.unitHeight/2}, 
                ${rightX - this.options.unitWidth} ${y - this.options.unitHeight/2}, ${rightX} ${y}" 
                fill="none" stroke="${this.options.applicationColor}" stroke-width="${this.options.lineWidth}" />`;
            
            // Store position for references
            this.positions.set(node, { x: (leftX + rightX) / 2, y, id });
            
            // Add left and right SVGs
            svg += leftSvg + rightSvg;
        }
        
        return svg;
    }

    /**
     * Find the binding lambda for a variable
     */
    findBindingLambda(variable) {
        let current = variable.parent;
        let varName = variable.value;
        
        while (current) {
            if (current instanceof Lambda && current.variable === varName) {
                return current;
            }
            current = current.parent;
        }
        
        return null; // Free variable
    }

    /**
     * Helper to draw a line
     */
    drawLine(x1, y1, x2, y2, color = null) {
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
            stroke="${color || this.options.strokeColor}" 
            stroke-width="${this.options.lineWidth}" />`;
    }

    /**
     * Save the SVG diagram to a file
     */
    saveSVG(lambdaExpression, filePath) {
        const svg = this.generateDiagram(lambdaExpression);
        fs.writeFileSync(filePath, svg);
        return filePath;
    }

    /**
     * Convert SVG to PNG using sharp library
     */
    savePNG(lambdaExpression, filePath) {
        const svg = this.generateDiagram(lambdaExpression);
        const svgPath = filePath.replace(/\.png$/, '.svg');
        
        // First save as SVG
        fs.writeFileSync(svgPath, svg);
        
        // Convert SVG to PNG using sharp
        sharp(Buffer.from(svg))
            .png()
            .toFile(filePath)
            .then(() => {
                console.log(`PNG saved to ${filePath}`);
            })
            .catch(err => {
                console.error('Error converting SVG to PNG:', err);
            });
        
        return filePath;
    }
}

module.exports = { ImprovedDiagramGenerator };