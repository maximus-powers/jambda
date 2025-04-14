/**
 * Term types for lambda calculus
 */
export declare enum TermType {
    VAR = "var",
    LAM = "lam",
    APP = "app"
}
interface TermData {
    func?: Term;
    arg?: Term;
}
/**
 * Term representation for lambda calculus
 */
export declare class Term {
    type: TermType;
    index?: number;
    body?: Term;
    func?: Term;
    arg?: Term;
    name?: string;
    variable?: string;
    parent?: Term;
    binderId?: string;
    appId?: string;
    isChurchNumeral?: boolean;
    numValue?: number;
    operation?: string;
    churchParent?: Term;
    constructor(type: TermType, data?: number | Term | TermData);
    /**
     * Pretty print the term
     */
    pretty(): string;
    _pretty(n: number, l: number): string;
    _parens(shouldWrap: boolean, str: string): string;
    /**
     * Calculate the size (number of nodes) of the term
     */
    size(): number;
}
interface DiagramResult {
    svg: string;
    height: number;
    width: number;
}
interface LabelPosition {
    x: number;
    y: number;
    skip?: boolean;
}
interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
interface TrompDiagramOptions {
    unitSize?: number;
    lineWidth?: number;
    padding?: number;
    backgroundColor?: string;
    colors?: string[];
    textColor?: string;
    operatorColor?: string;
    churchNumeralColor?: string;
    labelPadding?: number;
    labelOffset?: number;
    labelCollisionOffset?: number;
    width?: number;
    height?: number;
    showLabels?: boolean;
    hideApplicationSymbols?: boolean;
    preserveAspectRatio?: boolean;
    outputDir?: string;
}
/**
 * Main diagram generator class
 */
export declare class TrompDiagramGenerator {
    options: Required<TrompDiagramOptions>;
    labelPositions: BoundingBox[];
    seenOperations: Set<string>;
    constructor(options?: TrompDiagramOptions);
    /**
     * Simplified method for component color - always returns black
     */
    getComponentColor(): string;
    /**
     * Generate diagram from a lambda expression string
     * Ensures the diagram always fits within the output dimensions
     */
    generateDiagram(lambdaExpression: string): string;
    /**
     * Calculate the dimensions of the term for proper layout
     * This is crucial for Tromp diagram layout where connections must be at bottom-left
     */
    calculateDimensions(term: Term): {
        width: number;
        height: number;
    };
    /**
     * Internal dimension calculation, providing both width and height
     */
    _getDimensions(term: Term): {
        width: number;
        height: number;
    };
    calculateWidth(term: Term): number;
    calculateHeight(term: Term): number;
    /**
     * Draw a term precisely following the Haskell algorithm
     * Returns { svg, height, width } object
     */
    drawTermExact(term: Term): DiagramResult;
    /**
     * Helper function to translate SVG content by x, y
     */
    _translateSVG(svg: string, x: number, y: number): string;
    /**
     * Find a non-colliding position for a label
     */
    _findNonCollidingPosition(x: number, y: number, text: string, fontSize?: number): LabelPosition;
    /**
     * Helper method to find the binding lambda for a variable
     * using its De Bruijn index to traverse up the term tree
     */
    _findBindingLambda(varTerm: Term): Term | null;
    /**
     * Helper method to check if a term is part of a Church numeral
     */
    _isPartOfChurchNumeral(term: Term): boolean;
    /**
     * Generate a Church numeral representation for a number
     */
    _getChurchNumeral(n: number): string;
    /**
     * Save the SVG diagram to a file
     */
    saveSVG(lambdaExpression: string, filePath: string): string;
    /**
     * Convert SVG to PNG using sharp library
     */
    savePNG(lambdaExpression: string, filePath: string): string;
}
export {};
