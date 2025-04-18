export declare enum TermType {
    VAR = "var",
    LAM = "lam",
    APP = "app"
}
interface TermData {
    func?: Term;
    arg?: Term;
}
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
     * Calculate the size (number of nodes) of the term
     */
    size(): number;
}
interface DiagramResult {
    svg: string;
    height: number;
    width: number;
}
interface TrompDiagramOptions {
    unitSize?: number;
    lineWidth?: number;
    padding?: number;
    backgroundColor?: string;
    preserveAspectRatio?: boolean;
    outputDir?: string | undefined;
}
/**
 * Main tromp diagram generator class.
 */
export declare class TrompDiagramGenerator {
    options: Required<TrompDiagramOptions>;
    private seenOperations;
    private labelPositions;
    constructor(options?: TrompDiagramOptions);
    /**
     * Generate diagram from a lambda expression string.
     */
    generateDiagram(lambdaExpression: string): string;
    /**
     * Converts parsed expression/term into svg lines
     * Returns { svg, height, width } object
     */
    drawTerm(term: Term): DiagramResult;
    _translateSVG(svg: string, x: number, y: number): string;
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
