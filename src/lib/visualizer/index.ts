/**
 * Visualizer module for lambda calculus expressions
 * Exports a clean API for visualizing lambda calculus terms
 */
import fs from 'fs';
import path from 'path';
import { TrompDiagramGenerator } from './tromp-diagram';
import { renderSVGAsASCII } from './ascii-renderer';

/**
 * Options for the Lambda Visualizer
 */
export interface VisualizerOptions {
  outputDir?: string;
  unitSize?: number;
  lineWidth?: number;
  padding?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  preserveAspectRatio?: boolean;
  colors?: string[];
  operatorColor?: string;
  churchNumeralColor?: string;
  textColor?: string;
  labelPadding?: number;
  labelOffset?: number;
  labelCollisionOffset?: number;
  showLabels?: boolean;
  hideApplicationSymbols?: boolean;
}

/**
 * Lambda Visualizer class for creating visual diagrams of lambda calculus expressions
 */
export class LambdaVisualizer {
  private diagramGenerator: TrompDiagramGenerator;
  private outputDir?: string;

  /**
   * Create a new Lambda Visualizer
   * @param options Configuration options for the visualizer
   */
  constructor(options: VisualizerOptions = {}) {
    this.diagramGenerator = new TrompDiagramGenerator(options);
    
    // If outputDir is explicitly undefined, don't set a default
    if (options.outputDir === undefined) {
      this.outputDir = undefined;
    } else {
      this.outputDir = options.outputDir || path.join(process.cwd(), 'diagrams');
    }
  }

  /**
   * Generate a diagram from a lambda calculus expression
   * @param lambdaExpression - The lambda calculus expression to visualize
   * @param outputPath - The path where to save the diagram (optional)
   * @param format - The output format ('svg' or 'png')
   * @returns The path to the generated diagram or SVG string if no outputPath
   */
  visualize(lambdaExpression: string, outputPath?: string, format = 'svg'): string {
    try {
      // If no outputPath is provided, return the SVG string directly
      if (!outputPath) {
        // Only SVG can be returned as a string
        return this.diagramGenerator.generateDiagram(lambdaExpression);
      }

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
   * @param inputFile - Path to the file containing lambda expressions
   * @param outputDir - Directory to save the generated diagrams
   * @param format - The output format ('svg' or 'png')
   * @returns Paths to all generated diagrams
   */
  visualizeFromFile(inputFile: string, outputDir = this.outputDir, format = 'svg'): string[] {
    try {
      // Read the input file
      const content = fs.readFileSync(inputFile, 'utf8');
      
      // Split by line and process each expression
      const expressions = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
      
      // If output directory is undefined or empty, just return SVG strings
      if (!outputDir) {
        return expressions.map(expr => this.visualize(expr));
      }
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Generate a diagram for each expression
      const outputPaths: string[] = [];
      for (let i = 0; i < expressions.length; i++) {
        const expr = expressions[i];
        const outputPath = path.join(outputDir as string, `diagram_${i + 1}.${format}`);
        this.visualize(expr, outputPath, format);
        outputPaths.push(outputPath);
      }
      
      return outputPaths;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  /**
   * Render SVG as ASCII art
   * @param svg - The SVG content to render
   * @param preserveSpacing - Whether to preserve spacing between lambda terms (default: true)
   * @returns ASCII art representation of the SVG
   */
  renderSVGAsASCII(svg: string, preserveSpacing = true): string {
    // Use the imported renderSVGAsASCII function from ascii-renderer
    return renderSVGAsASCII(svg, preserveSpacing);
  }
}

// Re-export TrompDiagramGenerator for advanced use cases
export { TrompDiagramGenerator } from './tromp-diagram';
export { renderSVGAsASCII } from './ascii-renderer';