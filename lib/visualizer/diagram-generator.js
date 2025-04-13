/**
 * John Tromp Lambda Diagram Generator
 * Creates SVG diagrams from lambda calculus terms
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Parser } = require('./parser');
const { toDeBruijn, calculateHeight, calculateWidth, collectVariableIndices } = require('./debruijn');

class DiagramGenerator {
  constructor(options = {}) {
    this.options = {
      unitSize: options.unitSize || 20,
      lineWidth: options.lineWidth || 2,
      padding: options.padding || 20,
      useAlternative: options.useAlternative || false,
      strokeColor: options.strokeColor || '#000',
      backgroundColor: options.backgroundColor || '#fff',
    };
  }

  // Generate diagram from a lambda expression string
  generateDiagram(lambdaExpression) {
    // Parse the lambda expression
    const parser = new Parser(lambdaExpression);
    const parsedTerm = parser.parse();
    
    // Convert to De Bruijn notation
    const deBruijnTerm = toDeBruijn(parsedTerm);
    
    // Calculate diagram dimensions
    const height = calculateHeight(deBruijnTerm) * this.options.unitSize + 2 * this.options.padding;
    const width = calculateWidth(deBruijnTerm, this.options.useAlternative) * 3 * this.options.unitSize + 2 * this.options.padding;
    
    // Create an SVG container
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background-color:${this.options.backgroundColor}">`;
    
    // Add a rectangle background
    svg += `<rect width="${width}" height="${height}" fill="${this.options.backgroundColor}" />`;
    
    // Draw the diagram
    svg += this.drawTerm(deBruijnTerm, this.options.padding, this.options.padding, width - 2 * this.options.padding);
    
    // Close the SVG tag
    svg += '</svg>';
    
    return svg;
  }

  // Draw a lambda term recursively
  drawTerm(term, x, y, width) {
    let svg = '';
    const unitSize = this.options.unitSize;
    
    switch (term.type) {
      case 'abstraction': {
        // Draw the lambda (horizontal) line
        svg += this.drawLine(x, y, x + width, y);
        
        // Draw the body below the lambda line
        svg += this.drawTerm(term.body, x, y + unitSize, width);
        break;
      }
      
      case 'application': {
        // Calculate the left and right term widths
        const leftWidth = (this.options.useAlternative) 
          ? width / 2 
          : (calculateWidth(term.left, this.options.useAlternative) / calculateWidth(term, this.options.useAlternative)) * width;
          
        const rightWidth = width - leftWidth;
        
        // Draw the left and right parts
        svg += this.drawTerm(term.left, x, y, leftWidth);
        svg += this.drawTerm(term.right, x + leftWidth, y, rightWidth);
        
        // For the standard style, draw application connector
        if (!this.options.useAlternative) {
          // Draw the application line connecting the leftmost variables
          const leftVarIndices = collectVariableIndices(term.left).filter(i => i >= 0);
          const rightVarIndices = collectVariableIndices(term.right).filter(i => i >= 0);
          
          if (leftVarIndices.length > 0 && rightVarIndices.length > 0) {
            const leftVarX = x + leftWidth / 2;
            const rightVarX = x + leftWidth + rightWidth / 2;
            const connectionY = y + unitSize * 2;
            
            svg += this.drawLine(leftVarX, connectionY, rightVarX, connectionY);
          }
        } else {
          // Alternative style: Link nearest variables
          // For simplicity we're using a simplified version of alternative style
          // that connects the centers of terms
          const connectionY = y + unitSize * 2;
          svg += this.drawLine(x + leftWidth / 2, connectionY, x + leftWidth + rightWidth / 2, connectionY);
        }
        
        break;
      }
      
      case 'variable': {
        if (term.index >= 0) {
          // Draw vertical line from the binding lambda to the variable
          const varX = x + width / 2;
          const varY = y + unitSize / 2;
          const lineLength = term.index * unitSize;
          
          svg += this.drawLine(varX, y - lineLength, varX, varY);
        } else {
          // Free variable - draw a shorter line pointing up
          const varX = x + width / 2;
          svg += this.drawLine(varX, y - unitSize, varX, y);
        }
        break;
      }
    }
    
    return svg;
  }

  // Helper to draw a line
  drawLine(x1, y1, x2, y2) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
      stroke="${this.options.strokeColor}" 
      stroke-width="${this.options.lineWidth}" />`;
  }

  // Save the SVG diagram to a file
  saveSVG(lambdaExpression, filePath) {
    const svg = this.generateDiagram(lambdaExpression);
    fs.writeFileSync(filePath, svg);
    return filePath;
  }

  // Convert SVG to PNG using sharp library
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

module.exports = { DiagramGenerator };