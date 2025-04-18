// jambda - js to lambda converter & visualizer

export * from './lib/transpiler';
export * from './lib/visualizer';

import { transpile } from './lib/transpiler';
import { visualize as visualizeExpr, renderSVGAsASCII, VisualizerOptions } from './lib/visualizer';

// main api
export const jambda = {
  /**
   * Transpile JavaScript/TypeScript code to lambda calculus notation
   * @param code The JavaScript/TypeScript code to transpile
   * @returns Lambda calculus expression as a string
   */
  transpile(code: string): string {
    return transpile(code);
  },

  /**
   * Visualize a lambda calculus expression
   * @param expression The lambda calculus expression to visualize
   * @param options Visualization options
   * @param outputPath The output path for the visualization (optional)
   * @returns The path to the generated diagram or the SVG content if no outputPath is provided
   */
  visualize(expression: string, options: VisualizerOptions = {}, outputPath?: string): string {
    const format = outputPath?.endsWith('.png') ? 'png' : 'svg';
    return visualizeExpr(expression, options, outputPath, format);
  },

  /**
   * Transpile JavaScript/TypeScript code and visualize the resulting lambda expression
   * @param code The JavaScript/TypeScript code to transpile and visualize
   * @param options Visualization options
   * @param outputPath The output path for the visualization (optional)
   * @returns The path to the generated diagram or the SVG content if no outputPath is provided
   */
  transpileAndVisualize(code: string, options: VisualizerOptions = {}, outputPath?: string): string {
    // First transpile the code to lambda calculus
    const lambdaExpression = this.transpile(code);
    
    // Then visualize the expression
    return this.visualize(lambdaExpression, options, outputPath);
  },

  /**
   * Generate an ASCII art diagram from a lambda calculus expression
   * @param expression The lambda calculus expression to visualize
   * @param options Visualization options
   * @returns ASCII art representation of the diagram
   */
  generateAsciiDiagram(expression: string, options: VisualizerOptions = {}): string {
    // First generate SVG, then convert to ASCII
    const svg = visualizeExpr(expression, options);
    return renderSVGAsASCII(svg);
  },

  /**
   * Transpile JavaScript/TypeScript code and generate an ASCII art diagram
   * @param code The JavaScript/TypeScript code to transpile and visualize
   * @param options Visualization options
   * @returns ASCII art representation of the diagram
   */
  transpileAndGenerateAsciiDiagram(code: string, options: VisualizerOptions = {}): string {
    const lambdaExpression = this.transpile(code);
    return this.generateAsciiDiagram(lambdaExpression, options);
  }
};

// for commonjs
export default jambda;