import fs from 'fs';
import path from 'path';
import { TrompDiagramGenerator } from './tromp-diagram';

export interface VisualizerOptions {
  outputDir?: string;
  unitSize?: number;
  lineWidth?: number;
  padding?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  preserveAspectRatio?: boolean;
}

/**
 * Generate a tromp diagram from a lambda calculus expression
 * @param lambdaExpression - The lambda calculus expression to visualize
 * @param options - Visualization options
 * @param outputPath - The path where to save the diagram (optional)
 * @param format - The output format ('svg' or 'png')
 * @returns The path to the generated diagram, or SVG string if no outputPath
 */
export function visualize(
  lambdaExpression: string,
  options: VisualizerOptions = {},
  outputPath?: string,
  format = 'svg'
): string {
  try {
    const diagramGenerator = new TrompDiagramGenerator(options);

    // if no outputPath is provided, just return the svg string
    if (!outputPath) {
      return diagramGenerator.generateDiagram(lambdaExpression);
    }

    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    if (format === 'svg') {
      return diagramGenerator.saveSVG(lambdaExpression, outputPath);
    } else if (format === 'png') {
      return diagramGenerator.savePNG(lambdaExpression, outputPath);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error('Error generating diagram:', error);
    throw error;
  }
}

export { TrompDiagramGenerator } from './tromp-diagram';
export { renderSVGAsASCII } from './ascii-renderer';
