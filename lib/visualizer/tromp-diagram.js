/**
 * John Tromp Lambda Diagram Generator
 * Ported from the Haskell implementation to JavaScript
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Parser } = require('./parser');

/**
 * Term representation for lambda calculus
 */
class Term {
  static get TYPE() {
    return {
      VAR: 'var',
      LAM: 'lam',
      APP: 'app'
    };
  }

  constructor(type, data) {
    this.type = type;
    
    if (type === Term.TYPE.VAR) {
      this.index = data; // Index for De Bruijn representation
    } else if (type === Term.TYPE.LAM) {
      this.body = data; // Body of lambda abstraction
    } else if (type === Term.TYPE.APP) {
      this.func = data.func; // Function term
      this.arg = data.arg;   // Argument term
    }
  }

  /**
   * Pretty print the term
   */
  pretty() {
    return this._pretty(0, 0);
  }

  _pretty(n, l) {
    if (this.type === Term.TYPE.VAR) {
      return String(n - this.index - 1);
    } else if (this.type === Term.TYPE.LAM) {
      const body = this.body._pretty(n + 1, 0);
      return this._parens(l > 0, `\\${n}.${body}`);
    } else if (this.type === Term.TYPE.APP) {
      const func = this.func._pretty(n, 1);
      const arg = this.arg._pretty(n, 2);
      return this._parens(l > 1, `${func} ${arg}`);
    }
  }

  _parens(shouldWrap, str) {
    return shouldWrap ? `(${str})` : str;
  }

  /**
   * Calculate the size (number of nodes) of the term
   */
  size() {
    if (this.type === Term.TYPE.VAR) {
      return 1;
    } else if (this.type === Term.TYPE.LAM) {
      return 1 + this.body.size();
    } else if (this.type === Term.TYPE.APP) {
      return this.func.size() + this.arg.size();
    }
    return 0;
  }
}

/**
 * Convert a parsed term to our internal representation
 */
function convertParsedTerm(parsedTerm) {
  if (parsedTerm.type === 'variable') {
    // Create a variable term with its De Bruijn index
    const variable = new Term(Term.TYPE.VAR, 0); // Default to 0, will be updated
    // Store the original name for labeling
    variable.name = parsedTerm.name;
    
    // Check if this is a numeric constant
    if (!isNaN(variable.name)) {
      // For numbers, convert to Church numeral representation
      const numValue = parseInt(variable.name);
      return createChurchNumeral(numValue);
    }
    
    return variable;
  } else if (parsedTerm.type === 'abstraction') {
    // Create a lambda abstraction
    const body = convertParsedTerm(parsedTerm.body);
    const lambda = new Term(Term.TYPE.LAM, body);
    // Store the variable name for labeling
    lambda.variable = parsedTerm.variable;
    
    // Set parent reference
    body.parent = lambda;
    
    return lambda;
  } else if (parsedTerm.type === 'application') {
    // Create an application
    const func = convertParsedTerm(parsedTerm.left);
    const arg = convertParsedTerm(parsedTerm.right);
    const app = new Term(Term.TYPE.APP, { func, arg });
    
    // Set parent references
    func.parent = app;
    arg.parent = app;
    
    // Check if this might be an operator or number for labeling
    if (func.type === Term.TYPE.VAR && func.name) {
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
function createChurchNumeral(n) {
  // Special case for 0
  if (n === 0) {
    // λf.λx.x
    const x = new Term(Term.TYPE.VAR, 0);
    x.name = 'x';
    const lambdaX = new Term(Term.TYPE.LAM, x);
    lambdaX.variable = 'x';
    const lambdaF = new Term(Term.TYPE.LAM, lambdaX);
    lambdaF.variable = 'f';
    return lambdaF;
  }
  
  // For n > 0: λf.λx.f(f(...(f(x))...))
  // Start with the innermost term: x
  let innerTerm = new Term(Term.TYPE.VAR, 0);
  innerTerm.name = 'x';
  
  // Apply f n times: f(f(...f(x)))
  for (let i = 0; i < n; i++) {
    const f = new Term(Term.TYPE.VAR, 1); // f is one level up from x
    f.name = 'f';
    
    // Create application of f to the inner term
    const app = new Term(Term.TYPE.APP, { 
      func: f, 
      arg: innerTerm 
    });
    
    // Set parent references
    f.parent = app;
    innerTerm.parent = app;
    
    innerTerm = app;
  }
  
  // Wrap in λx
  const lambdaX = new Term(Term.TYPE.LAM, innerTerm);
  lambdaX.variable = 'x';
  innerTerm.parent = lambdaX;
  
  // Wrap in λf
  const lambdaF = new Term(Term.TYPE.LAM, lambdaX);
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
function assignIndices(term, depth = 0, env = new Map()) {
  if (term.type === Term.TYPE.VAR) {
    const name = term.name || 'x'; // Use variable name if available
    if (env.has(name)) {
      // The index is the distance (in terms of lambda abstractions) from the variable to its binder
      term.index = depth - env.get(name) - 1;
    } else {
      // Free variable (no binding lambda in scope)
      term.index = 0;
    }
  } else if (term.type === Term.TYPE.LAM) {
    // Create a new environment for the lambda body
    const newEnv = new Map(env);
    const varName = term.variable || 'x';
    
    // Register this lambda's variable in the environment
    newEnv.set(varName, depth);
    
    // Process the body with the updated environment
    assignIndices(term.body, depth + 1, newEnv);
  } else if (term.type === Term.TYPE.APP) {
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
    if (term.body && term.body.type === Term.TYPE.LAM) {
      // Set a reference so child terms can find their parent Church numeral
      term.body.churchParent = term;
    }
  }
  
  return term;
}

/**
 * Main diagram generator class
 */
class TrompDiagramGenerator {
  constructor(options = {}) {
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
      labelOffset: options.labelOffset || 15,                     // Offset for variable labels
      labelCollisionOffset: options.labelCollisionOffset || 10,   // How much to offset labels when collisions occur
      
      // Canvas dimensions
      width: options.width || 1200,                               // Default canvas width
      height: options.height || 900,                              // Default canvas height
      
      // Display options
      showLabels: options.showLabels || false,                    // Option to show term labels
      hideApplicationSymbols: options.hideApplicationSymbols || false, // Option to hide @ symbols
      preserveAspectRatio: options.preserveAspectRatio !== undefined ? options.preserveAspectRatio : true
    };
    
    // Reset label positions for each new diagram
    this.labelPositions = [];
    
    // Store seen operations to differentiate between nested applications
    this.seenOperations = new Set();
    
    // Track component colors for consistent coloring
    this.componentColors = new Map();
    
    // Color index for assigning colors to components
    this.colorIndex = 0;
  }

  /**
   * Get a color for a component based on its role
   * @param {string} componentType - The type of component ('lambda', 'variable', 'application')
   * @param {Term} term - The term this component belongs to
   * @param {string} binderId - For variables, the ID of the binding lambda
   * @returns {string} - The color for this component
   */
  getComponentColor(componentType, term = null, binderId = null) {
    // CASE 1: Variables should match their binding lambda's color
    if (componentType === 'variable' && binderId && this.componentColors.has(binderId)) {
      return this.componentColors.get(binderId);
    }
    
    // CASE 2: Every lambda abstraction gets its own unique color
    if (componentType === 'lambda') {
      // Generate a unique ID for this lambda abstraction
      const lambdaId = `lambda-${term && term.variable ? term.variable : ''}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Assign a unique color from our palette - ensuring each lambda gets a different color
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
    
    // CASE 3: Applications get their own color (simpler than lambdas)
    if (componentType === 'application') {
      // Create a unique ID for this application
      const appId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Assign next color in palette
      const color = this.options.colors[this.colorIndex % this.options.colors.length];
      this.colorIndex++;
      
      // Store for future reference
      this.componentColors.set(appId, color);
      return color;
    }
    
    // Fallback - assign a new color
    const defaultColor = this.options.colors[this.colorIndex % this.options.colors.length];
    this.colorIndex++;
    return defaultColor;
  }
  
  /**
   * Determine the semantic type of a term for coloring
   * @param {Term} term - The term to analyze
   * @returns {string} - The semantic type
   */
  _getSemanticType(term) {
    if (!term) return 'unknown';
    
    // Check for Church numerals
    if (term.isChurchNumeral) {
      return 'church-numeral';
    }
    
    // Check for true/false
    if (term.type === Term.TYPE.LAM && term.variable === 'x' && 
        term.body && term.body.type === Term.TYPE.LAM && 
        (term.body.variable === 'y' || term.body.variable === 'z')) {
      
      // Check if it's true (λx.λy.x) or false (λx.λy.y)
      if (term.body.body && term.body.body.type === Term.TYPE.VAR) {
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
  generateDiagram(lambdaExpression) {
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
    let scaleFactor;
    
    // Extreme scaling for large lambda terms
    // Based on term size, we use a more aggressive approach for complex terms
    const safetyFactor = term.size() > 80 ? 0.5 : (term.size() > 50 ? 0.6 : 0.7);
    const marginSize = 100; // Larger margin to ensure diagram fits
    
    // Set an extremely aggressive scaling to ensure the entire diagram fits
    scaleFactor = Math.min(
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
    
    // Adjust position to move diagram more to the left
    // Use a left offset that's smaller than the standard center position
    const horizontalShift = 1000; // Shift left by this amount
    const offsetX = (width - scaledWidth) / 2 - horizontalShift;
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
  calculateDimensions(term) {
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
  _getDimensions(term) {
    if (term.type === Term.TYPE.VAR) {
      // Variables are simple endpoints
      return { width: 1, height: 0 };
    } 
    else if (term.type === Term.TYPE.LAM) {
      // Lambda abstractions need space for the horizontal binder bar
      // and the body underneath it
      const bodyDims = this._getDimensions(term.body);
      return { 
        width: bodyDims.width,
        height: 1 + bodyDims.height // 1 for the lambda bar, plus body height
      };
    } 
    else if (term.type === Term.TYPE.APP) {
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
  calculateWidth(term) {
    if (term.type === Term.TYPE.VAR) {
      return 1;
    } else if (term.type === Term.TYPE.LAM) {
      return this.calculateWidth(term.body);
    } else if (term.type === Term.TYPE.APP) {
      return this.calculateWidth(term.func) + this.calculateWidth(term.arg);
    }
    return 0;
  }

  calculateHeight(term) {
    if (term.type === Term.TYPE.VAR) {
      return 0;
    } else if (term.type === Term.TYPE.LAM) {
      return 1 + this.calculateHeight(term.body);
    } else if (term.type === Term.TYPE.APP) {
      return 1 + Math.max(this.calculateHeight(term.func), this.calculateHeight(term.arg));
    }
    return 0;
  }

  /**
   * Draw a term precisely following the Haskell algorithm
   * Returns { svg, height, width } object
   */
  drawTermExact(term) {
    if (term.type === Term.TYPE.LAM) {
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
      
      // The horizontal binder bar should span exactly the width of the body below it
      const binderWidth = w * unitSize * 2;
      const binderX = this.options.padding;
      const binderY = this.options.padding;
      
      // Create the lambda binder (horizontal line over the body)
      // This is the defining visual characteristic of lambda terms in Tromp diagrams
      let svg = `<line x1="${binderX}" y1="${binderY}" x2="${binderX + binderWidth}" y2="${binderY}" 
                 stroke="${lambdaColor}" stroke-width="${this.options.lineWidth}" stroke-linecap="square" />`;
      
      // Add lambda symbol and variable name if labels are enabled
      if (this.options.showLabels) {
        let varName = term.variable || '';
        let labelText = '';
        
        // Special case for Church numerals - show number values
        if (term.isChurchNumeral && term.numValue !== undefined && !term.parent) {
          labelText = `${term.numValue}`;
        }
        // Special case for true/false
        else if (term.variable === 'x' && term.body && term.body.type === Term.TYPE.LAM &&
                (term.body.variable === 'y' || term.body.variable === 'z')) {
          // Identify true/false based on variable reference
          labelText = (term.body && term.body.body && term.body.body.type === Term.TYPE.VAR && 
                      term.body.body.index === 1) ? 'true' : 'false';
        }
        // Regular lambda terms
        else if (varName !== 'f') {
          // Don't show labels for 'f' variables (common in Church numerals)
          labelText = `λ${varName}`;
        }
        
        // Only add a label if we have text to show
        if (labelText) {
          // Position label at the right end of the lambda binder
          // This places labels where lambda terms connect with vertical lines from other terms
          const labelX = binderX + binderWidth + 5;  // Just after the end of the horizontal binder bar
          const labelY = binderY + 5;               // Just below the horizontal line
          
          // Find a non-colliding position, starting from right intersection point
          const labelPos = this._findNonCollidingPosition(labelX, labelY, labelText, 14);
          
          if (!labelPos.skip) {
            // Add the label with larger font and better visibility
            svg += `<text x="${labelPos.x}" y="${labelPos.y}" font-family="monospace" font-size="16" 
                    fill="${lambdaColor}" font-weight="bold">${labelText}</text>`;
          }
        }
      }
      
      // Position the body precisely under the binder bar
      // This follows the strict Tromp diagram layout rules
      const translatedBodySVG = this._translateSVG(bodyResult.svg, 0, unitSize);
      
      // Combine everything
      svg += translatedBodySVG;
      
      return { svg, height: h, width: w };
    } 
    else if (term.type === Term.TYPE.VAR) {
      // Handle variables according to Tromp diagram rules
      // Variable references are vertical lines connecting to their binding lambda
      const h = 0;
      const w = 1;
      
      // Calculate positions precisely
      const unitSize = this.options.unitSize;
      const varX = this.options.padding;
      const varY = this.options.padding;
      
      // Find the binding lambda for this variable using De Bruijn indices
      const bindingLambda = this._findBindingLambda(term);
      
      // Calculate the vertical line height based on De Bruijn index
      const varHeight = (term.index + 1) * unitSize;
      
      // Determine the color - variables MUST match their binding lambda's color
      let varColor;
      
      if (bindingLambda && bindingLambda.binderId) {
        // Use the exact same color as the binding lambda by passing its ID
        varColor = this.getComponentColor('variable', null, bindingLambda.binderId);
      } else {
        // For free variables (no binder found), use a default color
        varColor = this.options.colors[0]; // Use first color as default
      }
      
      // Create the variable line (vertical line connecting to the binding lambda)
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
        } else if (!this._isPartOfChurchNumeral(term)) {
          // Show De Bruijn index for non-Church numeral variables without names
          labelText = term.index.toString();
        }
        
        // Only proceed if we have a label to show
        if (labelText) {
          // For variables, position label at the intersection point where the vertical line 
          // meets the horizontal binder line from the binding lambda
          // This is where the vertical line intersects with the horizontal line from the right
          const labelX = varX - 15; // Just to the left of the variable's vertical line
          const labelY = varY - varHeight + 5; // Just below the intersection point with horizontal binder
          
          // Find a non-colliding position
          const labelPos = this._findNonCollidingPosition(labelX, labelY, labelText, 14);
          
          // Only add the label if not skipped
          if (!labelPos.skip) {
            // Use the same color as the variable line with larger font
            svg += `<text x="${labelPos.x}" y="${labelPos.y}" font-family="monospace" font-size="16" 
                    fill="${varColor}" font-weight="bold" text-anchor="end">${labelText}</text>`;
          }
        }
      }
      
      return { svg, height: h, width: w };
    } 
    else if (term.type === Term.TYPE.APP) {
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
      const h = Math.max(h1, h2) + 1; // +1 for the connecting bar
      const w = w1 + w2;
      
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
      
      // Draw vertical connecting lines if terms have different heights
      
      // Vertical line for function side if needed (if function is shorter than argument)
      if (funcBottom < barY) {
        const funcVLineX = this.options.padding;
        const funcVLineY = funcBottom;
        const funcVLineHeight = barY - funcBottom;
        
        svg += `<line x1="${funcVLineX}" y1="${funcVLineY}" x2="${funcVLineX}" y2="${funcVLineY + funcVLineHeight}" 
                stroke="${appColor}" stroke-width="${this.options.lineWidth}" />`;
      }
      
      // Vertical line for argument side if needed (if argument is shorter than function)
      if (argBottom < barY) {
        const argVLineX = this.options.padding + w1 * 2 * unitSize;
        const argVLineY = argBottom;
        const argVLineHeight = barY - argBottom;
        
        svg += `<line x1="${argVLineX}" y1="${argVLineY}" x2="${argVLineX}" y2="${argVLineY + argVLineHeight}" 
                stroke="${appColor}" stroke-width="${this.options.lineWidth}" />`;
      }
      
      // Draw the horizontal connecting bar at the bottom-left corners
      // This is the defining feature of application in Tromp diagrams
      const barX = this.options.padding; // Left side (function)
      const barWidth = 2 * w1 * unitSize; // Extend to the right side (argument)
      
      // Draw the horizontal connecting bar
      svg += `<line x1="${barX}" y1="${barY}" x2="${barX + barWidth}" y2="${barY}" 
              stroke="${appColor}" stroke-width="${this.options.lineWidth * 1.2}" stroke-linecap="round" />`;
              
      // ALWAYS add vertical connecting lines for both function and argument
      // This ensures proper connections between functions
      
      // Draw vertical connection lines for all lambda applications
      
      // Draw vertical line from horizontal bar to function
      const funcConnectionX = this.options.padding;
      const funcConnectionY1 = barY; // Start at the horizontal bar
      const funcConnectionY2 = Math.max(0, funcBottom - this.options.unitSize * 3); // Connect to near the function
      
      // Always draw vertical line for function, make it thicker for visibility
      svg += `<line x1="${funcConnectionX}" y1="${funcConnectionY1}" x2="${funcConnectionX}" y2="${funcConnectionY2}" 
              stroke="${appColor}" stroke-width="${this.options.lineWidth * 1.3}" stroke-linecap="round" />`;
      
      // Draw vertical line from horizontal bar to argument
      const argConnectionX = this.options.padding + w1 * 2 * unitSize; // Right side connection
      const argConnectionY1 = barY; // Start at the horizontal bar
      const argConnectionY2 = Math.max(0, argBottom - this.options.unitSize * 3); // Connect to near the argument
      
      // Always draw vertical line for argument, make it thicker for visibility
      svg += `<line x1="${argConnectionX}" y1="${argConnectionY1}" x2="${argConnectionX}" y2="${argConnectionY2}" 
              stroke="${appColor}" stroke-width="${this.options.lineWidth * 1.3}" stroke-linecap="round" />`;
      
      // Add the function term SVG
      svg += func.svg;
      
      // Add the argument term SVG (translated horizontally to the right)
      const translatedArgSVG = this._translateSVG(arg.svg, w1 * 2 * unitSize, 0);
      svg += translatedArgSVG;
      
      // Add application label if enabled
      if (this.options.showLabels) {
        let labelText = '@'; // Default application symbol
        let fontSize = 16;
        
        // Only label specific types of applications
        const isArithmetic = term.func && term.func.type === Term.TYPE.VAR && 
                           ['+', '-', '*', '/', 'Math'].includes(term.func.name);
        
        // Skip Church numeral internal applications
        if (term.func && term.func.name === 'f' && this._isPartOfChurchNumeral(term)) {
          // Skip labeling for Church numerals
        }
        // Arithmetic operations
        else if (isArithmetic) {
          labelText = term.func.name;
          fontSize = 16;
          
          // Add Church numeral values for arithmetic operations
          if (term.arg && term.arg.isChurchNumeral && term.arg.numValue !== undefined) {
            labelText += ` ${term.arg.numValue}`;
          }
        }
        // Application of selector functions (true/false)
        else if (term.func && term.func.type === Term.TYPE.LAM && 
                term.func.body && term.func.body.type === Term.TYPE.LAM) {
          // Only label the outermost application
          if (!term.parent || term.parent.type !== Term.TYPE.APP) {
            labelText = 'if';
          }
        }
        
        // Add the label if we have one
        if (labelText) {
          // Position labels at the intersection point where the horizontal connection bar
          // meets the vertical line from the argument (right side)
          // This places the label at the intersection of horizontal and vertical lines
          const labelX = argConnectionX - 5; // Just to the left of the right vertical line
          const labelY = argConnectionY1 - 5; // Just above the intersection point
          
          // Find a non-colliding position
          const labelPos = this._findNonCollidingPosition(labelX, labelY, labelText, fontSize);
          
          if (!labelPos.skip) {
            // Add the label with larger font for better visibility
            svg += `<text x="${labelPos.x}" y="${labelPos.y}" font-family="monospace" font-size="${fontSize}" 
                    fill="${appColor}" font-weight="bold" text-anchor="end">${labelText}</text>`;
          }
        }
      }
      
      return { svg, height: h, width: w };
    }
    
    return { svg: '', height: 0, width: 0 };
  }
  
  /**
   * Helper function to translate SVG content by x, y
   */
  _translateSVG(svg, x, y) {
    // Simple string replacement to translate all coordinates
    // This is a naive approach that works for our specific SVG format
    return svg.replace(/(x1|x2|cx)="([^"]+)"/g, (match, attr, val) => {
      return `${attr}="${parseFloat(val) + x}"`;
    }).replace(/(y1|y2|cy)="([^"]+)"/g, (match, attr, val) => {
      return `${attr}="${parseFloat(val) + y}"`;
    });
  }
  
  /**
   * Check if a label position would collide with any existing labels or lines
   * @param {number} x - X coordinate of the label
   * @param {number} y - Y coordinate of the label
   * @param {string} text - The label text
   * @param {number} fontSize - Font size for calculating label dimensions
   * @returns {boolean} - Whether a collision would occur
   */
  _checkLabelCollision(x, y, text, fontSize = 12) {
    // Calculate approximate label dimensions
    const labelWidth = text.length * (fontSize * 0.6); // rough estimate of label width
    const labelHeight = fontSize * 1.2;
    
    // Create bounding box for this label
    const labelBox = {
      x1: x - this.options.labelPadding,
      y1: y - labelHeight,
      x2: x + labelWidth + this.options.labelPadding,
      y2: y + this.options.labelPadding
    };
    
    // Check collision with other labels
    for (const existingLabel of this.labelPositions) {
      // Check if the boxes overlap
      if (
        labelBox.x1 <= existingLabel.x2 &&
        labelBox.x2 >= existingLabel.x1 &&
        labelBox.y1 <= existingLabel.y2 &&
        labelBox.y2 >= existingLabel.y1
      ) {
        return true; // Collision detected
      }
    }
    
    // No collision detected
    return false;
  }
  
  /**
   * Find a non-colliding position for a label
   * @param {number} x - Initial X coordinate
   * @param {number} y - Initial Y coordinate
   * @param {string} text - The label text
   * @param {number} fontSize - Font size
   * @returns {Object} - The non-colliding {x, y} position
   */
  _findNonCollidingPosition(x, y, text, fontSize = 12) {
    // Skip empty or f-only labels (we don't need to show these)
    if (!text || text === 'f') {
      return { x, y, skip: true };
    }
    
    // Calculate label dimensions
    const labelWidth = text.length * (fontSize * 0.6);
    const labelHeight = fontSize * 1.2;
    
    // Increase the collision offset for more spacing between labels
    const collisionOffset = this.options.labelCollisionOffset * 2;
    
    // Try the initial position first
    if (!this._checkLabelCollision(x, y, text, fontSize)) {
      // No collision, return the original position
      // Store this label position for future collision checks
      this.labelPositions.push({
        x1: x - this.options.labelPadding,
        y1: y - labelHeight,
        x2: x + labelWidth + this.options.labelPadding,
        y2: y + this.options.labelPadding
      });
      
      return { x, y };
    }
    
    // Try different offsets if there's a collision
    const offsets = [
      { dx: 0, dy: -collisionOffset * 1.5 }, // More above
      { dx: collisionOffset, dy: 0 },        // Right
      { dx: 0, dy: collisionOffset * 1.5 },  // More below
      { dx: -collisionOffset, dy: 0 },       // Left
      
      // Diagonals with larger offsets
      { dx: collisionOffset, dy: -collisionOffset },   // Top-right
      { dx: collisionOffset, dy: collisionOffset },    // Bottom-right
      { dx: -collisionOffset, dy: collisionOffset },   // Bottom-left
      { dx: -collisionOffset, dy: -collisionOffset }   // Top-left
    ];
    
    // Try each offset
    for (const offset of offsets) {
      const newX = x + offset.dx;
      const newY = y + offset.dy;
      
      if (!this._checkLabelCollision(newX, newY, text, fontSize)) {
        // Found a non-colliding position
        // Store this label position for future collision checks
        this.labelPositions.push({
          x1: newX - this.options.labelPadding,
          y1: newY - labelHeight,
          x2: newX + labelWidth + this.options.labelPadding,
          y2: newY + this.options.labelPadding
        });
        
        return { x: newX, y: newY };
      }
    }
    
    // If all direct offsets fail, try a broader search with larger increments
    for (let i = 2; i <= 8; i++) { // Increased upper limit for more search space
      for (const offset of offsets) {
        const newX = x + (offset.dx * i);
        const newY = y + (offset.dy * i);
        
        if (!this._checkLabelCollision(newX, newY, text, fontSize)) {
          // Found a non-colliding position
          // Store this label position for future collision checks
          this.labelPositions.push({
            x1: newX - this.options.labelPadding,
            y1: newY - labelHeight,
            x2: newX + labelWidth + this.options.labelPadding,
            y2: newY + this.options.labelPadding
          });
          
          return { x: newX, y: newY };
        }
      }
    }
    
    // If everything fails, use a position far from the diagram
    // This ensures labels don't overlap even if we need to place them far away
    const farPosition = {
      x: x + collisionOffset * 10,
      y: y - collisionOffset * 10
    };
    
    this.labelPositions.push({
      x1: farPosition.x - this.options.labelPadding,
      y1: farPosition.y - labelHeight,
      x2: farPosition.x + labelWidth + this.options.labelPadding,
      y2: farPosition.y + this.options.labelPadding
    });
    
    return farPosition;
  }
  
  /**
   * Helper method to find the binding lambda for a variable
   * using its De Bruijn index to traverse up the term tree
   */
  _findBindingLambda(varTerm) {
    if (varTerm.type !== Term.TYPE.VAR) {
      return null;
    }
    
    // The De Bruijn index tells us how many lambda abstractions to go up
    const index = varTerm.index;
    
    // Start from the variable's parent
    let current = varTerm.parent;
    let lambdasFound = 0;
    
    // Traverse up the tree
    while (current) {
      if (current.type === Term.TYPE.LAM) {
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
  _isPartOfChurchNumeral(term) {
    // Check if the term has a parent that is a Church numeral
    let current = term;
    while (current) {
      if (current.isChurchNumeral) {
        return true;
      }
      
      // Check parent if it's an application
      if (current.parent && current.parent.type === Term.TYPE.APP) {
        if (current.parent.func === current) {
          current = current.parent;
        } else {
          current = current.parent;
        }
      }
      // Check parent if it's a lambda
      else if (current.parent && current.parent.type === Term.TYPE.LAM) {
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
  _getChurchNumeral(n) {
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

module.exports = { TrompDiagramGenerator, Term };