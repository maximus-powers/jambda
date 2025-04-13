/**
 * John Tromp Lambda Diagram Generator
 * Ported from the Haskell implementation to TypeScript
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Parser } from './parser';

/**
 * Term types for lambda calculus
 */
export enum TermType {
  VAR = 'var',
  LAM = 'lam',
  APP = 'app'
}

interface TermData {
  func?: Term;
  arg?: Term;
}

/**
 * Term representation for lambda calculus
 */
export class Term {
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

  constructor(type: TermType, data?: number | Term | TermData) {
    this.type = type;
    
    if (type === TermType.VAR && typeof data === 'number') {
      this.index = data; // Index for De Bruijn representation
    } else if (type === TermType.LAM && data instanceof Term) {
      this.body = data; // Body of lambda abstraction
    } else if (type === TermType.APP && typeof data === 'object' && data !== null) {
      const appData = data as TermData;
      this.func = appData.func; // Function term
      this.arg = appData.arg;   // Argument term
    }
  }

  /**
   * Pretty print the term
   */
  pretty(): string {
    return this._pretty(0, 0);
  }

  _pretty(n: number, l: number): string {
    if (this.type === TermType.VAR && this.index !== undefined) {
      return String(n - this.index - 1);
    } else if (this.type === TermType.LAM && this.body) {
      const body = this.body._pretty(n + 1, 0);
      return this._parens(l > 0, `\\${n}.${body}`);
    } else if (this.type === TermType.APP && this.func && this.arg) {
      const func = this.func._pretty(n, 1);
      const arg = this.arg._pretty(n, 2);
      return this._parens(l > 1, `${func} ${arg}`);
    }
    return '';
  }

  _parens(shouldWrap: boolean, str: string): string {
    return shouldWrap ? `(${str})` : str;
  }

  /**
   * Calculate the size (number of nodes) of the term
   */
  size(): number {
    if (this.type === TermType.VAR) {
      return 1;
    } else if (this.type === TermType.LAM && this.body) {
      return 1 + this.body.size();
    } else if (this.type === TermType.APP && this.func && this.arg) {
      return this.func.size() + this.arg.size();
    }
    return 0;
  }
}

interface ParsedTerm {
  type: string;
  name?: string;
  body?: ParsedTerm;
  variable?: string;
  left?: ParsedTerm;
  right?: ParsedTerm;
}

/**
 * Convert a parsed term to our internal representation
 */
function convertParsedTerm(parsedTerm: ParsedTerm): Term {
  if (parsedTerm.type === 'variable') {
    // Create a variable term with its De Bruijn index
    const variable = new Term(TermType.VAR, 0); // Default to 0, will be updated
    // Store the original name for labeling
    variable.name = parsedTerm.name;
    
    // Check if this is a numeric constant
    if (variable.name && !isNaN(Number(variable.name))) {
      // For numbers, convert to Church numeral representation
      const numValue = parseInt(variable.name);
      return createChurchNumeral(numValue);
    }
    
    return variable;
  } else if (parsedTerm.type === 'abstraction' && parsedTerm.body) {
    // Create a lambda abstraction
    const body = convertParsedTerm(parsedTerm.body);
    const lambda = new Term(TermType.LAM, body);
    // Store the variable name for labeling
    lambda.variable = parsedTerm.variable;
    
    // Set parent reference
    body.parent = lambda;
    
    return lambda;
  } else if (parsedTerm.type === 'application' && parsedTerm.left && parsedTerm.right) {
    // Create an application
    const func = convertParsedTerm(parsedTerm.left);
    const arg = convertParsedTerm(parsedTerm.right);
    const app = new Term(TermType.APP, { func, arg });
    
    // Set parent references
    func.parent = app;
    arg.parent = app;
    
    // Check if this might be an operator or number for labeling
    if (func.type === TermType.VAR && func.name) {
      // Store the operation name (like +, -, *, /)
      app.operation = func.name;
    }
    
    return app;
  }
  throw new Error(`Unknown term type: ${parsedTerm.type}`);
}

/**
 * Create a Church numeral term representation for a number
 * Church numeral n is λf.λx.f^n(x)
 */
function createChurchNumeral(n: number): Term {
  // Special case for 0
  if (n === 0) {
    // λf.λx.x
    const x = new Term(TermType.VAR, 0);
    x.name = 'x';
    const lambdaX = new Term(TermType.LAM, x);
    lambdaX.variable = 'x';
    const lambdaF = new Term(TermType.LAM, lambdaX);
    lambdaF.variable = 'f';
    return lambdaF;
  }
  
  // For n > 0: λf.λx.f(f(...(f(x))...))
  // Start with the innermost term: x
  let innerTerm = new Term(TermType.VAR, 0);
  innerTerm.name = 'x';
  
  // Apply f n times: f(f(...f(x)))
  for (let i = 0; i < n; i++) {
    const f = new Term(TermType.VAR, 1); // f is one level up from x
    f.name = 'f';
    
    // Create application of f to the inner term
    const app = new Term(TermType.APP, { 
      func: f, 
      arg: innerTerm 
    });
    
    // Set parent references
    f.parent = app;
    innerTerm.parent = app;
    
    innerTerm = app;
  }
  
  // Wrap in λx
  const lambdaX = new Term(TermType.LAM, innerTerm);
  lambdaX.variable = 'x';
  innerTerm.parent = lambdaX;
  
  // Wrap in λf
  const lambdaF = new Term(TermType.LAM, lambdaX);
  lambdaF.variable = 'f';
  lambdaX.parent = lambdaF;
  
  // Mark this as a Church numeral for reference
  lambdaF.isChurchNumeral = true;
  lambdaF.numValue = n;
  
  return lambdaF;
}

/**
 * Update variable indices to use De Bruijn notation
 * This is crucial for connecting variables to their binding lambdas in the diagram
 */
function assignIndices(term: Term, depth = 0, env = new Map<string, number>()): Term {
  if (term.type === TermType.VAR) {
    const name = term.name || 'x'; // Use variable name if available
    if (env.has(name)) {
      // The index is the distance (in terms of lambda abstractions) from the variable to its binder
      const envValue = env.get(name);
      if (envValue !== undefined) {
        term.index = depth - envValue - 1;
      }
    } else {
      // Free variable (no binding lambda in scope)
      term.index = 0;
    }
  } else if (term.type === TermType.LAM && term.body) {
    // Create a new environment for the lambda body
    const newEnv = new Map(env);
    const varName = term.variable || 'x';
    
    // Register this lambda's variable in the environment
    newEnv.set(varName, depth);
    
    // Process the body with the updated environment
    assignIndices(term.body, depth + 1, newEnv);
  } else if (term.type === TermType.APP && term.func && term.arg) {
    // Process both sides of the application with the same environment
    assignIndices(term.func, depth, env);
    assignIndices(term.arg, depth, env);
  }
  
  // Special processing for Church numerals
  if (term.isChurchNumeral) {
    // Church numerals have an f-x nested structure: λf.λx.f(f(...f(x)))
    // The indices are already set correctly by the recursive calls,
    // but we can verify the structure here if needed
    
    // For Church numerals, properly track their nestings
    if (term.body && term.body.type === TermType.LAM) {
      // Set a reference so child terms can find their parent Church numeral
      term.body.churchParent = term;
    }
  }
  
  return term;
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
export class TrompDiagramGenerator {
  options: Required<TrompDiagramOptions>;
  labelPositions: BoundingBox[];
  seenOperations: Set<string>;
  componentColors: Map<string, string>;
  colorIndex: number;

  constructor(options: TrompDiagramOptions = {}) {
    this.options = {
      unitSize: options.unitSize || 30,         // Larger unit size for better visibility
      lineWidth: options.lineWidth || 3,        // Thicker lines for visibility
      padding: options.padding || 60,           // More padding
      backgroundColor: options.backgroundColor || '#000000',
      
      // Color palette for individual components
      colors: options.colors || [
        '#ff5555',  // Red
        '#8be9fd',  // Cyan
        '#50fa7b',  // Green
        '#ffb86c',  // Orange
        '#bd93f9',  // Purple
        '#ff79c6',  // Pink
        '#f1fa8c',  // Yellow
        '#5af78e',  // Bright Green
        '#57c7ff',  // Light Blue
        '#ff6ac1'   // Bright Pink
      ],
      
      // Special colors for specific elements
      textColor: options.textColor || '#f8f8f2',          // Light text color
      operatorColor: options.operatorColor || '#ffb86c',  // Orange for operators (+, -, *, /)
      churchNumeralColor: options.churchNumeralColor || '#bd93f9', // Purple for Church numerals
      
      // Label positioning
      labelPadding: options.labelPadding || 5,                    // Padding around labels
      labelOffset: options.labelOffset || 0,
      labelCollisionOffset: options.labelCollisionOffset || 0,
      
      // Canvas dimensions
      width: options.width || 1200,                               // Default canvas width
      height: options.height || 900,                              // Default canvas height
      
      // Display options
      showLabels: options.showLabels || false,                    // Option to show term labels
      hideApplicationSymbols: options.hideApplicationSymbols || false, // Option to hide @ symbols
      preserveAspectRatio: options.preserveAspectRatio !== undefined ? options.preserveAspectRatio : true,
      outputDir: options.outputDir || 'diagrams'
    };
    
    // Reset label positions for each new diagram
    this.labelPositions = [];
    
    // Store seen operations to differentiate between nested applications
    this.seenOperations = new Set<string>();
    
    // Track component colors for consistent coloring
    this.componentColors = new Map<string, string>();
    
    // Color index for assigning colors to components
    this.colorIndex = 0;
  }

  /**
   * Get a color for a component based on its role
   */
  getComponentColor(componentType: string, term?: Term | null, binderId?: string | null): string {
    // CASE 1: Lambda abstraction - always gets its own unique color
    if (componentType === 'lambda') {
      // Generate a unique ID for this lambda abstraction
      const lambdaId = `lambda-${term && term.variable ? term.variable : ''}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Assign a unique color from our palette
      const color = this.options.colors[this.colorIndex % this.options.colors.length];
      this.colorIndex++;
      
      // Store for future reference - variables bound by this lambda will use this color
      this.componentColors.set(lambdaId, color);
      
      // Save ID in the term for variables to reference
      if (term) {
        term.binderId = lambdaId;
      }
      
      return color;
    }
    
    // CASE 2: Variables should match their binding lambda's color
    if (componentType === 'variable' && binderId && this.componentColors.has(binderId)) {
      const color = this.componentColors.get(binderId);
      return color !== undefined ? color : this.options.colors[0];
    }
    
    // CASE 3: Applications should get their own color similar to the variable they extend from
    if (componentType === 'application') {
      // Try to use a color similar to the argument's variable if possible
      let baseColor: string | null = null;
      
      if (term && term.arg && term.arg.type === TermType.VAR && term.arg.binderId) {
        // If the argument is a variable, use a color similar to its binding lambda
        if (this.componentColors.has(term.arg.binderId)) {
          const color = this.componentColors.get(term.arg.binderId);
          if (color !== undefined) {
            baseColor = color;
          }
        }
      }
      // If no base color found, use next in palette
      if (!baseColor) {
        baseColor = this.options.colors[this.colorIndex % this.options.colors.length];
        this.colorIndex++;
      }
      
      // Create a unique ID for this application
      const appId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Store this application's color for reference
      this.componentColors.set(appId, baseColor);
      
      // If term is provided, store the app ID in the term
      if (term) {
        term.appId = appId;
      }
      
      return baseColor;
    }
    
    // Fallback - assign a new color
    const defaultColor = this.options.colors[this.colorIndex % this.options.colors.length];
    this.colorIndex++;
    return defaultColor;
  }
  
  /**
   * Determine the semantic type of a term for coloring
   */
  _getSemanticType(term?: Term): string {
    if (!term) return 'unknown';
    
    // Check for Church numerals
    if (term.isChurchNumeral) {
      return 'church-numeral';
    }
    
    // Check for true/false
    if (term.type === TermType.LAM && term.variable === 'x' && 
        term.body && term.body.type === TermType.LAM && 
        (term.body.variable === 'y' || term.body.variable === 'z')) {
      
      // Check if it's true (λx.λy.x) or false (λx.λy.y)
      if (term.body.body && term.body.body.type === TermType.VAR) {
        if (term.body.body.index === 1) {
          return 'boolean-true';
        } else if (term.body.body.index === 0) {
          return 'boolean-false';
        }
      }
      
      return 'boolean';
    }
    
    // Default to the term type
    return term.type;
  }
  
  /**
   * Generate diagram from a lambda expression string
   * Ensures the diagram always fits within the output dimensions
   */
  generateDiagram(lambdaExpression: string): string {
    // Reset state for each new diagram
    this.seenOperations = new Set();
    this.labelPositions = [];
    this.componentColors = new Map();
    this.colorIndex = 0;
    
    // Parse the lambda expression
    const parser = new Parser(lambdaExpression);
    const parsedTerm = parser.parse();
    
    // Convert to our internal representation
    const term = convertParsedTerm(parsedTerm);
    assignIndices(term);
    
    // Calculate raw dimensions based on term structure
    const dims = this.calculateDimensions(term);
    
    // Log term dimensions for debugging
    console.log(`Term dimensions - width: ${dims.width}, height: ${dims.height}`);
    console.log(`Term size: ${term.size()}`);
    
    // Determine the raw size needed for the diagram without scaling
    // For very complex terms, use even less padding to ensure diagram fits
    const baseWidth = dims.width * this.options.unitSize + this.options.padding;
    const baseHeight = dims.height * this.options.unitSize + this.options.padding;
    
    // Calculate scaling factor to make the diagram fit COMPLETELY within the output dimensions
    // Extreme scaling for large lambda terms
    // Based on term size, we use a more aggressive approach for complex terms
    const safetyFactor = term.size() > 80 ? 0.5 : (term.size() > 50 ? 0.6 : 0.7);
    const marginSize = 100; // Larger margin to ensure diagram fits
    
    // Set an extremely aggressive scaling to ensure the entire diagram fits
    const scaleFactor = Math.min(
      (this.options.width - marginSize) / baseWidth,
      (this.options.height - marginSize) / baseHeight
    ) * safetyFactor; // Additional safety margin based on term complexity
    
    // Log scaling information for debugging
    console.log(`Base width: ${baseWidth}, Base height: ${baseHeight}`);
    console.log(`Scale factor: ${scaleFactor}`);
    console.log(`Scaled size: ${baseWidth * scaleFactor} x ${baseHeight * scaleFactor}`);
    
    // For very complex diagrams, we may need to scale down significantly
    // No minimum scale - we prioritize fitting the entire diagram over visibility of details
    
    // Apply scaling to unit size
    const scaledUnitSize = this.options.unitSize * scaleFactor;
    const originalUnitSize = this.options.unitSize;
    this.options.unitSize = scaledUnitSize;
    
    // Set output dimensions (always use specified width/height for the SVG)
    const width = this.options.width;
    const height = this.options.height;
    
    // Create SVG container with fixed dimensions and viewBox
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" 
             viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`;
    
    // Add background
    svg += `<rect width="${width}" height="${height}" fill="${this.options.backgroundColor}" />`;
    
    // Calculate the final scaled dimensions with absolute minimum padding
    const scaledWidth = dims.width * scaledUnitSize + this.options.padding * scaleFactor;
    const scaledHeight = dims.height * scaledUnitSize + this.options.padding * scaleFactor;
    
    // Properly center the diagram in the image
    // Calculate exact center position without any additional margins
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    
    // Log centering information for debugging
    console.log(`Image size: ${width} x ${height}`);
    console.log(`Scaled diagram size: ${scaledWidth} x ${scaledHeight}`);
    console.log(`Centering offsets: ${offsetX}, ${offsetY}`);
    
    // Create a centered group for the diagram
    svg += `<g transform="translate(${offsetX}, ${offsetY})">`;
    
    // Draw the diagram
    const figure = this.drawTermExact(term);
    svg += figure.svg;
    
    // Close the group and SVG
    svg += '</g></svg>';
    
    // Restore original unit size for subsequent diagrams
    this.options.unitSize = originalUnitSize;
    
    return svg;
  }

  /**
   * Calculate the dimensions of the term for proper layout
   * This is crucial for Tromp diagram layout where connections must be at bottom-left
   */
  calculateDimensions(term: Term): { width: number; height: number } {
    // Get width and height based on term structure
    const { width, height } = this._getDimensions(term);
    
    // For very large expressions, use tighter spacing
    const size = term.size ? term.size() : 0;
    const additionalSpace = size > 50 ? 0.5 : (size > 20 ? 1 : 2);
    
    // Add minimal additional space for complex expressions to save space
    return { 
      width: width + additionalSpace, // Less extra width for large diagrams
      height: height + additionalSpace // Less extra height for large diagrams
    };
  }

  /**
   * Internal dimension calculation, providing both width and height
   */
  _getDimensions(term: Term): { width: number; height: number } {
    if (term.type === TermType.VAR) {
      // Variables are simple endpoints
      return { width: 1, height: 0 };
    } 
    else if (term.type === TermType.LAM && term.body) {
      // Lambda abstractions need space for the horizontal binder bar
      // and the body underneath it
      const bodyDims = this._getDimensions(term.body);
      return { 
        width: bodyDims.width,
        height: 1 + bodyDims.height // 1 for the lambda bar, plus body height
      };
    } 
    else if (term.type === TermType.APP && term.func && term.arg) {
      // Applications need space for both terms side by side
      // plus the connecting bar at the bottom
      const funcDims = this._getDimensions(term.func);
      const argDims = this._getDimensions(term.arg);
      
      return {
        width: funcDims.width + argDims.width, // Sum of widths
        height: 1 + Math.max(funcDims.height, argDims.height) // 1 for the connecting bar
      };
    }
    
    return { width: 0, height: 0 };
  }

  // Helper functions for the old dimension calculations, preserved for compatibility
  calculateWidth(term: Term): number {
    if (term.type === TermType.VAR) {
      return 1;
    } else if (term.type === TermType.LAM && term.body) {
      return this.calculateWidth(term.body);
    } else if (term.type === TermType.APP && term.func && term.arg) {
      return this.calculateWidth(term.func) + this.calculateWidth(term.arg);
    }
    return 0;
  }

  calculateHeight(term: Term): number {
    if (term.type === TermType.VAR) {
      return 0;
    } else if (term.type === TermType.LAM && term.body) {
      return 1 + this.calculateHeight(term.body);
    } else if (term.type === TermType.APP && term.func && term.arg) {
      return 1 + Math.max(this.calculateHeight(term.func), this.calculateHeight(term.arg));
    }
    return 0;
  }

  /**
   * Draw a term precisely following the Haskell algorithm
   * Returns { svg, height, width } object
   */
  drawTermExact(term: Term): DiagramResult {
    if (term.type === TermType.LAM && term.body) {
      // Handle lambda abstraction according to Tromp diagram rules
      // Lambda terms are represented by horizontal lines over their body
      
      // First draw the body
      const bodyResult = this.drawTermExact(term.body);
      const h = bodyResult.height + 1;
      const w = bodyResult.width;
      
      // Calculate positions in proper Tromp diagram style
      const unitSize = this.options.unitSize;
      
      // Get color for this lambda abstraction 
      // This will also store the lambda's ID for variables to reference
      const lambdaColor = this.getComponentColor('lambda', term);
      
      // Custom spacing with gaps between lambda abstractions
      // Make the binder slightly narrower than standard to create visual separation
      const horizontalShorteningFactor = 0.85; // Make a bit shorter than standard
      const binderWidth = w * unitSize * 2 * horizontalShorteningFactor; 
      
      // Add horizontal gap between abstractions to space them out
      const horizontalGap = unitSize * 1.2; // Add a horizontal gap between lambda abstractions
      const binderX = this.options.padding + horizontalGap;
      const binderY = this.options.padding;
      
      // Create the lambda binder (horizontal line over the body)
      // This is the defining visual characteristic of lambda terms in Tromp diagrams
      // Use a thicker line for better visibility and rounded ends
      let svg = `<line x1="${binderX}" y1="${binderY}" x2="${binderX + binderWidth}" y2="${binderY}" 
               stroke="${lambdaColor}" stroke-width="${this.options.lineWidth * 1.2}" stroke-linecap="round" />`;
      
      // Add lambda symbol and variable name if labels are enabled
      if (this.options.showLabels) {
        let varName = term.variable || '';
        let labelText = '';
        
        // Special case for Church numerals - show number values
        if (term.isChurchNumeral && term.numValue !== undefined && !term.parent) {
          labelText = `${term.numValue}`;
        }
        // Special case for true/false
        else if (term.variable === 'x' && term.body && term.body.type === TermType.LAM &&
                (term.body.variable === 'y' || term.body.variable === 'z')) {
          // Identify true/false based on variable reference
          labelText = (term.body && term.body.body && term.body.body.type === TermType.VAR && 
                      term.body.body.index === 1) ? 'true' : 'false';
        }
        // Regular lambda terms
        else if (varName !== 'f') {
          // Don't show labels for 'f' variables (common in Church numerals)
          labelText = `λ${varName}`;
        }
        
        // Only add a label if we have text to show
        if (labelText) {
          // Position label directly at the left end of the lambda bar where it's drawn
          const labelX = binderX;  // At the left end of the horizontal binder bar
          const labelY = binderY - 5;  // Just above the horizontal line
          
          // Find a non-colliding position, starting from the left end
          const labelPos = this._findNonCollidingPosition(labelX, labelY, labelText, 14);
          
          if (!labelPos.skip) {
            // Add the label with larger font and better visibility
            // Position text directly at the line's starting point
            svg += `<text x="${labelPos.x}" y="${labelPos.y}" font-family="monospace" font-size="14" 
                  fill="${lambdaColor}" font-weight="bold">${labelText}</text>`;
          }
        }
      }
      
      // Follow the Haskell example - place the body directly below the binder
      // with exactly 1 unit of vertical space
      const verticalSpacing = unitSize; // Exactly 1 unit spacing as in Haskell
      
      // No horizontal offset needed - body should be aligned directly beneath binder
      const translatedBodySVG = this._translateSVG(bodyResult.svg, 0, verticalSpacing);
      
      // Combine everything
      svg += translatedBodySVG;
      
      return { svg, height: h, width: w };
    } 
    else if (term.type === TermType.VAR) {
      // Handle variables according to Tromp diagram rules
      // Variable references are vertical lines connecting to their binding lambda
      const h = 0;
      const w = 1;
      
      // Adjust variable position to align with lambda binders accounting for gaps
      const unitSize = this.options.unitSize;
      
      // Align with the lambda abstractions that have been shifted right
      const horizontalGap = unitSize * 1.2; // Same as used for lambda abstractions 
      const varX = this.options.padding + horizontalGap;
      const varY = this.options.padding;
      
      // Find the binding lambda for this variable using De Bruijn indices
      const bindingLambda = this._findBindingLambda(term);
      
      // Simple calculation directly from the Haskell example
      // Each variable's height is determined solely by its De Bruijn index
      const indexDistance = term.index !== undefined ? (term.index + 1) : 0; // De Bruijn index
      
      // Determine the color - variables MUST match their binding lambda's color
      let varColor;
      
      if (bindingLambda && bindingLambda.binderId) {
        // Use the exact same color as the binding lambda by passing its ID
        varColor = this.getComponentColor('variable', null, bindingLambda.binderId);
      } else {
        // For free variables (no binder found), use a default color
        varColor = this.options.colors[0]; // Use first color as default
      }
      
      // Following Haskell example exactly:
      // Variables should be drawn as vertical lines of the correct length
      // to connect to the binding lambda's horizontal bar
      // Calculate the exact index distance and height needed
      const varHeight = indexDistance * unitSize;
      
      // Draw the vertical line only - no horizontal connectors needed
      // The correct height will ensure it visually connects to the lambda bar
      let svg = `<line x1="${varX}" y1="${varY}" x2="${varX}" y2="${varY - varHeight}" 
               stroke="${varColor}" stroke-width="${this.options.lineWidth}" />`;
      
      // Add variable labels if enabled
      if (this.options.showLabels) {
        // Skip unimportant labels like 'f' in Church numerals
        if (term.name === 'f' || (term.name === 'x' && this._isPartOfChurchNumeral(term))) {
          return { svg, height: h, width: w };
        }
        
        // Determine the proper label text
        let labelText = '';
        
        // Only show meaningful variable names
        if (term.name && term.name !== 'f') {
          labelText = term.name;
        } else if (term.index !== undefined && !this._isPartOfChurchNumeral(term)) {
          // Show De Bruijn index for non-Church numeral variables without names
          labelText = term.index.toString();
        }
        
        // Only proceed if we have a label to show
        if (labelText) {
          // Position variable label directly at where its vertical line is drawn
          const labelX = varX + 3; // Just slightly to the right of the variable's vertical line
          const labelY = varY; // At the same Y position where the vertical line starts
          
          // Find a non-colliding position
          const labelPos = this._findNonCollidingPosition(labelX, labelY, labelText, 12);
          
          // Only add the label if not skipped
          if (!labelPos.skip) {
            // Use the same color as the variable line with smaller font for less intrusion
            svg += `<text x="${labelPos.x}" y="${labelPos.y}" font-family="monospace" font-size="12" 
                  fill="${varColor}" font-weight="bold">${labelText}</text>`;
          }
        }
      }
      
      return { svg, height: h, width: w };
    } 
    else if (term.type === TermType.APP && term.func && term.arg) {
      // Handle application strictly according to Tromp diagram rules:
      // "An application of one function to another is given by a horizontal bar connecting 
      // the bottom-left corners of the two, with the function on the left and its input on the right."
      
      // First draw both sides of the application
      const func = this.drawTermExact(term.func);
      const arg = this.drawTermExact(term.arg);
      
      // Get dimensions of each side
      const h1 = func.height;
      const w1 = func.width;
      const h2 = arg.height;
      const w2 = arg.width;
      
      // Calculate the overall dimensions of this application
      // Keep applications tightly connected as in original Tromp diagrams
      const h = Math.max(h1, h2) + 1; // Standard +1 for the connecting bar
      const w = w1 + w2; // Standard width - no extra spacing for applications
      
      // Unit size for precise positioning
      const unitSize = this.options.unitSize;
      
      // Get a unique color for this application - each application bar should have its own color
      const appColor = this.getComponentColor('application');
      
      // Start building the SVG
      let svg = '';
      
      // Calculate the bottom levels of both terms
      const funcBottom = this.options.padding + h1 * unitSize;
      const argBottom = this.options.padding + h2 * unitSize;
      
      // Determine the vertical positions of the connecting bar
      // It should connect at the bottom of both terms
      const barY = Math.max(funcBottom, argBottom);
      
      // Following the Haskell approach for vertical connecting lines
      
      // Vertical line for function side if needed (if function is shorter than argument)
      // Account for the horizontal gap in all positions
      const horizontalGap = unitSize * 1.2; // Same as used for lambda abstractions
      
      if (funcBottom < barY) {
        const funcVLineX = this.options.padding + horizontalGap; // Align with variables and lambda abstraction
        const funcVLineY = funcBottom;
        const funcVLineHeight = barY - funcBottom;
        
        svg += `<line x1="${funcVLineX}" y1="${funcVLineY}" x2="${funcVLineX}" y2="${funcVLineY + funcVLineHeight}" 
              stroke="${appColor}" stroke-width="${this.options.lineWidth}" />`;
      }
      
      // Vertical line for argument side if needed (if argument is shorter than function)
      if (argBottom < barY) {
        // Calculate right side position - at 2*width of the function term plus the horizontal gap
        const argVXPos = this.options.padding + horizontalGap + 2 * w1 * unitSize; // Right end alignment with gap
        const argVLineY = argBottom;
        const argVLineHeight = barY - argBottom;
        
        svg += `<line x1="${argVXPos}" y1="${argVLineY}" x2="${argVXPos}" y2="${argVLineY + argVLineHeight}" 
              stroke="${appColor}" stroke-width="${this.options.lineWidth}" />`;
      }
      
      // Draw the horizontal connecting bar at the bottom-left corners
      // This is the defining feature of application in Tromp diagrams
      // We've already defined horizontalGap above, so use it directly
      const barX = this.options.padding + horizontalGap; // Align with lambda abstractions
      const barWidth = 2 * w1 * unitSize; // Exactly 2 * function width
      
      // Get colors for left and right terms to maintain consistent color per lambda abstraction
      let leftTermColor = appColor;
      if (term.func.type === TermType.LAM && term.func.binderId && this.componentColors.has(term.func.binderId)) {
        const color = this.componentColors.get(term.func.binderId);
        if (color !== undefined) {
          leftTermColor = color;
        }
      }
      
      let rightTermColor = appColor;
      if (term.arg.type === TermType.LAM && term.arg.binderId && this.componentColors.has(term.arg.binderId)) {
        const color = this.componentColors.get(term.arg.binderId);
        if (color !== undefined) {
          rightTermColor = color;
        }
      }
      
      // Draw the application horizontal bar - simpler rendering following Haskell example
      svg += `<line x1="${barX}" y1="${barY}" x2="${barX + barWidth}" y2="${barY}" 
            stroke="${appColor}" stroke-width="${this.options.lineWidth}" />`;
      
      
      // Add vertical connection lines for applications to the functions they come from
      // 1. Left vertical connection - from the application bar up to its function
      const funcConnectionX = barX; // Left edge of horizontal bar
      const funcConnectionY1 = barY; // Start at the horizontal bar
      const funcConnectionY2 = Math.max(0, funcBottom - unitSize); // Go up to near the function
      
      // Draw this vertical line in the same color as the application
      svg += `<line x1="${funcConnectionX}" y1="${funcConnectionY1}" x2="${funcConnectionX}" y2="${funcConnectionY2}" 
            stroke="${appColor}" stroke-width="${this.options.lineWidth}" />`;
      
      // 2. Right vertical connection - from the application bar up to its input argument
      const argConnectionX = barX + barWidth; // Right edge of horizontal bar
      const argConnectionY1 = barY; // Start at the horizontal bar
      const argConnectionY2 = Math.max(0, argBottom - unitSize); // Go up to near the argument
      
      // Draw this vertical line in the same color as the application
      svg += `<line x1="${argConnectionX}" y1="${argConnectionY1}" x2="${argConnectionX}" y2="${argConnectionY2}" 
            stroke="${appColor}" stroke-width="${this.options.lineWidth}" />`;
      
      // Add the function term SVG
      svg += func.svg;
      
      // Add the argument term SVG (translated horizontally to the right)
      // Follow Haskell example: translate by 2 * width of the function
      const translatedArgSVG = this._translateSVG(arg.svg, w1 * 2 * unitSize, 0);
      svg += translatedArgSVG;
      
      // Applications should not have labels as requested
      // Special case only for truly meaningful operations
      if (this.options.showLabels) {
        // Only check for important arithmetic operations that need labels
        const isArithmetic = term.func.type === TermType.VAR && 
                         term.func.name !== undefined &&
                         ['+', '-', '*', '/'].includes(term.func.name);
        
        // Only show labels for arithmetic operations, not regular applications
        if (isArithmetic && term.func.name) {
          const labelText = term.func.name;
          const fontSize = 16;
          
          // Position labels directly at the left edge of the horizontal application bar
          const labelX = barX; // Left edge of the horizontal bar where it's drawn
          const labelY = barY + 12; // Just below the horizontal bar
          
          // Find a non-colliding position
          const labelPos = this._findNonCollidingPosition(labelX, labelY, labelText, fontSize);
          
          if (!labelPos.skip) {
            // Use a distinctive color for operation labels and left-align with the horizontal bar
            svg += `<text x="${labelPos.x}" y="${labelPos.y}" font-family="monospace" font-size="12" 
                  fill="${this.options.operatorColor}" font-weight="bold">${labelText}</text>`;
          }
        }
        // All other applications have no labels
      }
      
      return { svg, height: h, width: w };
    }
    
    return { svg: '', height: 0, width: 0 };
  }
  
  /**
   * Helper function to translate SVG content by x, y
   */
  _translateSVG(svg: string, x: number, y: number): string {
    // Simple string replacement to translate all coordinates
    // This is a naive approach that works for our specific SVG format
    return svg.replace(/(x1|x2|cx)="([^"]+)"/g, (match, attr, val) => {
      return `${attr}="${parseFloat(val) + x}"`;
    }).replace(/(y1|y2|cy)="([^"]+)"/g, (match, attr, val) => {
      return `${attr}="${parseFloat(val) + y}"`;
    });
  }
  
  /**
   * Find a non-colliding position for a label
   */
  _findNonCollidingPosition(x: number, y: number, text: string, fontSize = 12): LabelPosition {
    // Skip empty or f-only labels (we don't need to show these)
    if (!text || text === 'f') {
      return { x, y, skip: true };
    }
    
    // Force direct positioning at the specified location
    // For proper alignment with the corresponding lines
    // Store this label position for tracking
    const labelWidth = text.length * (fontSize * 0.6);
    const labelHeight = fontSize * 1.2;
    
    this.labelPositions.push({
      x1: x - this.options.labelPadding,
      y1: y - labelHeight,
      x2: x + labelWidth + this.options.labelPadding,
      y2: y + this.options.labelPadding
    });
    
    // Return the exact position requested without collision avoidance
    return { x, y };
  }
  
  /**
   * Helper method to find the binding lambda for a variable
   * using its De Bruijn index to traverse up the term tree
   */
  _findBindingLambda(varTerm: Term): Term | null {
    if (varTerm.type !== TermType.VAR || varTerm.index === undefined) {
      return null;
    }
    
    // The De Bruijn index tells us how many lambda abstractions to go up
    const index = varTerm.index;
    
    // Start from the variable's parent
    let current = varTerm.parent;
    let lambdasFound = 0;
    
    // Traverse up the tree
    while (current) {
      if (current.type === TermType.LAM) {
        // Count lambda abstractions as we go up
        lambdasFound++;
        
        // If this is the binding lambda for our variable, return it
        if (lambdasFound > index) {
          return current;
        }
      }
      
      // Go up to the parent
      current = current.parent;
    }
    
    // If we get here, this is a free variable
    return null;
  }
  
  /**
   * Helper method to check if a term is part of a Church numeral
   */
  _isPartOfChurchNumeral(term: Term): boolean {
    // Check if the term has a parent that is a Church numeral
    let current: Term | undefined = term;
    while (current) {
      if (current.isChurchNumeral) {
        return true;
      }
      
      // Check parent if it's an application
      if (current.parent && current.parent.type === TermType.APP) {
        current = current.parent;
      }
      // Check parent if it's a lambda
      else if (current.parent && current.parent.type === TermType.LAM) {
        current = current.parent;
      }
      else {
        break;
      }
    }
    
    return false;
  }
  
  /**
   * Generate a Church numeral representation for a number
   */
  _getChurchNumeral(n: number): string {
    // Church numeral n is λf.λx.f^n(x)
    // 0: λf.λx.x
    // 1: λf.λx.f(x)
    // 2: λf.λx.f(f(x))
    // etc.
    
    if (n === 0) {
      return 'λf.λx.x';
    }
    
    let inner = 'x';
    for (let i = 0; i < n; i++) {
      inner = `f(${inner})`;
    }
    
    return `λf.λx.${inner}`;
  }

  /**
   * Save the SVG diagram to a file
   */
  saveSVG(lambdaExpression: string, filePath: string): string {
    const svg = this.generateDiagram(lambdaExpression);
    fs.writeFileSync(filePath, svg);
    return filePath;
  }

  /**
   * Convert SVG to PNG using sharp library
   */
  savePNG(lambdaExpression: string, filePath: string): string {
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