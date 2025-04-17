/**
 * Jambda - JavaScript to Lambda Calculus Converter and Visualizer
 * A unified library for transpiling JavaScript to lambda calculus
 * and visualizing lambda terms using John Tromp diagrams.
 */

// Export all from visualizer and transpiler modules
export * from './lib/transpiler';
export * from './lib/visualizer';

// Create a unified jambda object with all primary functionality
import { parse } from './lib/transpiler';
import { LambdaVisualizer, VisualizerOptions } from './lib/visualizer';

/**
 * The main Jambda API object with unified functions
 */
export const jambda = {
  /**
   * Transpile JavaScript/TypeScript code to lambda calculus notation
   * @param code The JavaScript/TypeScript code to transpile
   * @returns Lambda calculus expression as a string
   */
  transpile(code: string): string {
    return parse(code);
  },

  /**
   * Visualize a lambda calculus expression
   * @param expression The lambda calculus expression to visualize
   * @param outputPath The output path for the visualization (optional)
   * @param options Visualization options
   * @returns The path to the generated diagram or the SVG content if no outputPath is provided
   */
  visualize(expression: string, outputPath?: string, options: VisualizerOptions = {}): string {
    const visualizer = new LambdaVisualizer(options);
    const format = outputPath?.endsWith('.png') ? 'png' : 'svg';
    return visualizer.visualize(expression, outputPath, format);
  },

  /**
   * Transpile JavaScript/TypeScript code and visualize the resulting lambda expression
   * @param code The JavaScript/TypeScript code to transpile and visualize
   * @param outputPath The output path for the visualization (optional)
   * @param options Visualization options
   * @returns The path to the generated diagram or the SVG content if no outputPath is provided
   */
  transpileAndVisualize(code: string, outputPath?: string, options: VisualizerOptions = {}): string {
    // First transpile the code to lambda calculus
    const lambdaExpression = this.transpile(code);
    
    // Then visualize the expression
    return this.visualize(lambdaExpression, outputPath, options);
  },

  /**
   * Generate an ASCII art diagram from a lambda calculus expression
   * @param expression The lambda calculus expression to visualize
   * @returns ASCII art representation of the diagram
   */
  generateAsciiDiagram(expression: string): string {
    const visualizer = new LambdaVisualizer();
    // First generate SVG, then convert to ASCII
    const svg = visualizer.visualize(expression);
    return visualizer.renderSVGAsASCII(svg);
  },

  /**
   * Transpile JavaScript/TypeScript code and generate an ASCII art diagram
   * @param code The JavaScript/TypeScript code to transpile and visualize
   * @returns ASCII art representation of the diagram
   */
  transpileAndGenerateAsciiDiagram(code: string): string {
    const lambdaExpression = this.transpile(code);
    return this.generateAsciiDiagram(lambdaExpression);
  }
};

// Default export for CommonJS compatibility
export default jambda;