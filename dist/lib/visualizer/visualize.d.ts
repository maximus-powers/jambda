#!/usr/bin/env node
import { TrompDiagramGenerator } from './tromp-diagram';
interface VisualizerOptions {
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
 * Visualizes a lambda calculus expression as a John Tromp diagram
 */
export declare class LambdaVisualizer {
    diagramGenerator: TrompDiagramGenerator;
    outputDir: string;
    constructor(options?: VisualizerOptions);
    /**
     * Generate a diagram from a lambda calculus expression
     * @param lambdaExpression - The lambda calculus expression to visualize
     * @param outputPath - The path where to save the diagram (optional)
     * @param format - The output format ('svg' or 'png')
     * @returns The path to the generated diagram or SVG string if no outputPath
     */
    visualize(lambdaExpression: string, outputPath?: string, format?: string): string;
    /**
     * Visualize a lambda calculus expression from a file
     * @param inputFile - Path to the file containing lambda expressions
     * @param outputDir - Directory to save the generated diagrams
     * @param format - The output format ('svg' or 'png')
     * @returns Paths to all generated diagrams
     */
    visualizeFromFile(inputFile: string, outputDir?: string, format?: string): string[];
}
export {};
