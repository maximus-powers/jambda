/**
 * ASCII renderer for SVG diagrams
 * Converts SVG content to ASCII art for terminal display
 */

/**
 * Convert an SVG tromp diagram to ASCII
 * @param svg SVG content to render
 * @param preserveSpacing Whether to preserve spacing between terms (default: true)
 * @returns ASCII art representation of the SVG diagram
 */
export function renderSVGAsASCII(svg: string, preserveSpacing = true): string {
  // extract svg dimensions
  const widthMatch = svg.match(/width="([^"]+)"/);
  const heightMatch = svg.match(/height="([^"]+)"/);
  const width = widthMatch ? parseInt(widthMatch[1]) : 1200;
  const height = heightMatch ? parseInt(heightMatch[1]) : 800;
  const lineMatches = svg.match(/<line/g);
  const lineCount = lineMatches ? lineMatches.length : 0;

  // Auto-scale canvas size based on SVG dimensions and complexity
  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Get terminal width (default to 100 if we can't determine)
  const terminalWidth = process.stdout.columns || 100;
  // Set a reasonable terminal height (default to 40 if we can't determine)
  const terminalHeight = process.stdout.rows || 40;

  // Check if this is a very complex diagram
  const isComplexWideDiagram = lineCount > 200 || width > 1000;

  // Start with sensible defaults for a terminal, but accommodate wide diagrams
  let asciiWidth = Math.min(terminalWidth - 4, isComplexWideDiagram ? 100 : 60);
  let asciiHeight = Math.min(terminalHeight - 6, isComplexWideDiagram ? 22 : 30);

  // Special handling for wide diagrams (common in church numerals)
  if (aspectRatio > 2.5) {
    // Very wide diagram - increase width significantly
    asciiWidth = Math.min(terminalWidth - 2, 120);
    asciiHeight = 30; // Increase height to avoid cramping
  } else if (aspectRatio < 0.7) {
    // Tall diagram - reduce width
    asciiWidth = Math.floor(asciiWidth * 0.7);
    asciiHeight = Math.min(asciiHeight + 5, 35);
  }

  // Calculate scale factors based on diagram characteristics
  let scaleFactorX, scaleFactorY;

  if (isComplexWideDiagram) {
    // For celsius-to-fahrenheit and other wide complex diagrams
    // Use aggressive scaling but maintain more vertical spacing
    scaleFactorX = 0.1; // Slightly less aggressive
    scaleFactorY = 0.1; // Increased vertical spacing
  } else if (lineCount > 100) {
    // Very complex diagram
    scaleFactorX = 0.15;
    scaleFactorY = 0.2;
  } else if (lineCount > 50) {
    // Moderately complex diagram
    scaleFactorX = 0.2;
    scaleFactorY = 0.3;
  } else {
    // Simple diagram
    scaleFactorX = 0.3;
    scaleFactorY = 0.2;
  }

  // If preserveSpacing is explicitly set, increase vertical spacing further
  if (preserveSpacing) {
    scaleFactorY *= 1.2; // 20% more vertical spacing when requested
    asciiHeight = Math.min(asciiHeight + 5, 40);
  }

  // Create ASCII canvas (2D array of characters)
  const canvas = Array(asciiHeight)
    .fill(0)
    .map(() => Array(asciiWidth).fill(' '));

  // Extract all lines from the SVG
  const lineRegex = /<line\s+x1="([^"]+)"\s+y1="([^"]+)"\s+x2="([^"]+)"\s+y2="([^"]+)"/g;
  let match;

  // Process each line in the SVG
  while ((match = lineRegex.exec(svg)) !== null) {
    // Ignore the full match (index 0) and extract the coordinate strings
    const [, x1Str, y1Str, x2Str, y2Str] = match;

    // Convert SVG coordinates to ASCII canvas coordinates with proper scaling
    const x1 = Math.min(
      asciiWidth - 1,
      Math.max(0, Math.round((parseFloat(x1Str) * asciiWidth * scaleFactorX) / width))
    );
    const y1 = Math.min(
      asciiHeight - 1,
      Math.max(0, Math.round((parseFloat(y1Str) * asciiHeight * scaleFactorY) / height))
    );
    const x2 = Math.min(
      asciiWidth - 1,
      Math.max(0, Math.round((parseFloat(x2Str) * asciiWidth * scaleFactorX) / width))
    );
    const y2 = Math.min(
      asciiHeight - 1,
      Math.max(0, Math.round((parseFloat(y2Str) * asciiHeight * scaleFactorY) / height))
    );

    // Draw the line with appropriate box-drawing characters
    drawLineOnCanvas(canvas, x1, y1, x2, y2);
  }

  // Apply distinguishing markers to application lines
  distinguishApplicationLines(canvas);

  // Fill gaps more aggressively for larger diagrams
  fillGapsForLargeDiagrams(canvas, lineCount > 50);

  // Remove empty rows and unnecessary whitespace
  const trimmedCanvas = trimWhitespace(canvas);

  // Join all rows to create the final ASCII art
  return trimmedCanvas.map((row) => row.join('')).join('\n');
}

/**
 * Draw a line on the canvas using Bresenham's algorithm
 */
function drawLineOnCanvas(
  canvas: string[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  // Handle horizontal lines
  if (y1 === y2) {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x <= end; x++) {
      canvas[y1][x] = '─';
    }
    return;
  }

  // Handle vertical lines
  if (x1 === x2) {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    for (let y = start; y <= end; y++) {
      canvas[y][x1] = '│';
    }
    return;
  }

  // Handle diagonal lines
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  // Copy current position
  let x = x1;
  let y = y1;

  // Using a loop that always evaluates to true to implement Bresenham's algorithm
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Choose appropriate character based on line direction
    let char = '+'; // Default for points to be processed in the second pass

    // Reduce the number of diagonal lines to make the diagram cleaner
    // Use a horizontal or vertical line instead for short diagonals
    if (dx <= 1 && dy > 1) {
      // Nearly vertical line
      char = '│';
    } else if (dy <= 1 && dx > 1) {
      // Nearly horizontal line
      char = '─';
    } else if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
      // More horizontal than vertical
      char = sx * sy > 0 ? '\\' : '/';
    } else {
      // More vertical than horizontal
      char = sx * sy > 0 ? '/' : '\\';
    }

    // Set character on canvas
    canvas[y][x] = char;

    // Exit loop if we've reached the end
    if (x === x2 && y === y2) break;

    // Update position based on error
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  // Second pass to improve intersections with proper box-drawing characters
  improveIntersections(canvas);
}

/**
 * Replace simple intersections (+) with proper box-drawing characters
 * Also enhances the diagram by filling in small gaps
 */
function improveIntersections(canvas: string[][]): void {
  // First, fill in small gaps to create more continuous lines
  fillSmallGaps(canvas);
  for (let y = 0; y < canvas.length; y++) {
    for (let x = 0; x < canvas[y].length; x++) {
      // Only process intersection points
      if (canvas[y][x] === '+') {
        // Check adjacent cells to determine connection type
        const hasNorth =
          y > 0 && ['│', '┌', '┐', '┬', '┤', '├', '┼', '/', '\\'].includes(canvas[y - 1][x]);
        const hasSouth =
          y < canvas.length - 1 &&
          ['│', '└', '┘', '┴', '┤', '├', '┼', '/', '\\'].includes(canvas[y + 1][x]);
        const hasWest =
          x > 0 && ['─', '┌', '└', '┬', '┴', '├', '┼', '/', '\\'].includes(canvas[y][x - 1]);
        const hasEast =
          x < canvas[y].length - 1 &&
          ['─', '┐', '┘', '┬', '┴', '┤', '┼', '/', '\\'].includes(canvas[y][x + 1]);

        // Determine the right box character based on connections
        if (hasNorth && hasSouth && hasWest && hasEast) canvas[y][x] = '┼';
        else if (hasNorth && hasSouth && hasWest) canvas[y][x] = '┤';
        else if (hasNorth && hasSouth && hasEast) canvas[y][x] = '├';
        else if (hasNorth && hasWest && hasEast) canvas[y][x] = '┴';
        else if (hasSouth && hasWest && hasEast) canvas[y][x] = '┬';
        else if (hasNorth && hasSouth) canvas[y][x] = '│';
        else if (hasWest && hasEast) canvas[y][x] = '─';
        else if (hasNorth && hasEast) canvas[y][x] = '└';
        else if (hasNorth && hasWest) canvas[y][x] = '┘';
        else if (hasSouth && hasEast) canvas[y][x] = '┌';
        else if (hasSouth && hasWest) canvas[y][x] = '┐';
      }
    }
  }
}

/**
 * Trim unnecessary whitespace from the ASCII canvas
 */
function trimWhitespace(canvas: string[][]): string[][] {
  // First, find the bounds of actual content
  let minX = canvas[0].length;
  let maxX = 0;
  let minY = canvas.length;
  let maxY = 0;

  // Find the actual content bounds
  for (let y = 0; y < canvas.length; y++) {
    for (let x = 0; x < canvas[y].length; x++) {
      if (canvas[y][x] !== ' ') {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // If we found no content, return the original canvas
  if (minX > maxX || minY > maxY) {
    return canvas;
  }

  // Add less padding for larger diagrams to avoid cutoff
  const padding = canvas[0].length > 50 ? 1 : 2;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - 1);
  maxX = Math.min(canvas[0].length - 1, maxX + padding);
  maxY = Math.min(canvas.length - 1, maxY + 1);

  // Create a new canvas with just the content
  const trimmed: string[][] = [];

  for (let y = minY; y <= maxY; y++) {
    trimmed.push(canvas[y].slice(minX, maxX + 1));
  }

  return trimmed;
}

/**
 * Fill small gaps in lines to create more continuous output
 * Also adds special handling for lambda applications
 */
function fillSmallGaps(canvas: string[][]): void {
  const height = canvas.length;
  if (height === 0) return;
  const width = canvas[0].length;

  // Create a copy of the canvas to avoid modifying while iterating
  const original = canvas.map((row) => [...row]);

  // Fill horizontal gaps (─ ... ─) but ONLY for lambda abstractions (top bars)
  // This helps to distinguish different application lines
  for (let y = 0; y < height / 3; y++) {
    // Only process the top third of the diagram (lambda bars)
    for (let x = 0; x < width - 2; x++) {
      // Skip all horizontal gap filling in the top rows of the diagram
      // This is where the church numerals appear, and we want to preserve their distinct lines
      if (y < 8) {
        // In church numeral sections, don't fill any gaps to preserve the distinct horizontal lines
        continue;
      }
      // For other parts of the diagram, fill in small gaps as before
      else if (original[y][x] === '─' && original[y][x + 1] === ' ' && original[y][x + 2] === '─') {
        canvas[y][x + 1] = '─';
      }
    }
  }

  // Fill vertical gaps (│ ... │)
  for (let y = 0; y < height - 2; y++) {
    for (let x = 0; x < width; x++) {
      if (original[y][x] === '│' && original[y + 1][x] === ' ' && original[y + 2][x] === '│') {
        canvas[y + 1][x] = '│';
      }
    }
  }

  // Fill diagonal gaps in normal direction
  for (let y = 0; y < height - 2; y++) {
    for (let x = 0; x < width - 2; x++) {
      if (
        (original[y][x] === '/' && original[y + 2][x + 2] === '/') ||
        (original[y][x] === '\\' && original[y + 2][x + 2] === '\\')
      ) {
        canvas[y + 1][x + 1] = original[y][x];
      }
    }
  }

  // Fill diagonal gaps in reverse direction
  for (let y = 0; y < height - 2; y++) {
    for (let x = 2; x < width; x++) {
      if (
        (original[y][x] === '/' && original[y + 2][x - 2] === '/') ||
        (original[y][x] === '\\' && original[y + 2][x - 2] === '\\')
      ) {
        canvas[y + 1][x - 1] = original[y][x];
      }
    }
  }

  // Add special handling for application lines
  // For each row below the first third, try to identify distinct application lines
  let applicationRows = [];
  for (let y = Math.floor((height * 2) / 3); y < height; y++) {
    // Check if this row looks like an application line (has horizontal lines)
    let isApplicationRow = false;
    for (let x = 0; x < width; x++) {
      if (original[y][x] === '─') {
        isApplicationRow = true;
        break;
      }
    }
    if (isApplicationRow) {
      applicationRows.push(y);
    }
  }

  // If we found application rows that are adjacent, add spacing between them
  if (applicationRows.length > 1) {
    for (let i = 0; i < applicationRows.length - 1; i++) {
      if (applicationRows[i + 1] - applicationRows[i] === 1) {
        // Add space by shifting down all rows below this one
        for (let y = applicationRows[i + 1] + 1; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (y < height - 1) {
              canvas[y + 1][x] = canvas[y][x];
              canvas[y][x] = ' ';
            }
          }
        }

        // Update the application row indices
        for (let j = i + 1; j < applicationRows.length; j++) {
          applicationRows[j]++;
        }
      }
    }
  }
}

/**
 * Additional function to enhance gap filling for larger diagrams
 * This is particularly useful for complex lambda expressions
 */
function fillGapsForLargeDiagrams(canvas: string[][], isLargeDiagram: boolean): void {
  if (!isLargeDiagram) return;

  const height = canvas.length;
  if (height === 0) return;
  const width = canvas[0].length;

  // Create a copy of the canvas to avoid modifying while iterating
  const original = canvas.map((row) => [...row]);

  // For large diagrams, we need more aggressive gap filling
  // Fill horizontal gaps of length 2 (─ · · ─) for lambda abstractions
  for (let y = 0; y < height / 3; y++) {
    // Only process the top third (lambda bars)
    for (let x = 0; x < width - 3; x++) {
      // Skip all horizontal gap filling in the top rows of the diagram
      // This is where the church numerals appear, and we want to preserve their distinct lines
      if (y < 8) {
        // In church numeral sections, don't fill any gaps to preserve the distinct horizontal lines
        continue;
      }
      // For other parts of the diagram, fill in gaps as before
      else if (
        original[y][x] === '─' &&
        original[y][x + 1] === ' ' &&
        original[y][x + 2] === ' ' &&
        original[y][x + 3] === '─'
      ) {
        canvas[y][x + 1] = '─';
        canvas[y][x + 2] = '─';
      }
    }
  }

  // Fill vertical gaps of length 2
  for (let y = 0; y < height - 3; y++) {
    for (let x = 0; x < width; x++) {
      if (
        original[y][x] === '│' &&
        original[y + 1][x] === ' ' &&
        original[y + 2][x] === ' ' &&
        original[y + 3][x] === '│'
      ) {
        canvas[y + 1][x] = '│';
        canvas[y + 2][x] = '│';
      }
    }
  }

  // Fill diagonal gaps of length 2 in normal direction
  for (let y = 0; y < height - 3; y++) {
    for (let x = 0; x < width - 3; x++) {
      if (
        (original[y][x] === '/' && original[y + 3][x + 3] === '/') ||
        (original[y][x] === '\\' && original[y + 3][x + 3] === '\\')
      ) {
        canvas[y + 1][x + 1] = original[y][x];
        canvas[y + 2][x + 2] = original[y][x];
      }
    }
  }

  // Fill diagonal gaps of length 2 in reverse direction
  for (let y = 0; y < height - 3; y++) {
    for (let x = 3; x < width; x++) {
      if (
        (original[y][x] === '/' && original[y + 3][x - 3] === '/') ||
        (original[y][x] === '\\' && original[y + 3][x - 3] === '\\')
      ) {
        canvas[y + 1][x - 1] = original[y][x];
        canvas[y + 2][x - 2] = original[y][x];
      }
    }
  }
}

/**
 * Add visual distinction to application lines to differentiate them
 */
function distinguishApplicationLines(canvas: string[][]): void {
  const height = canvas.length;
  if (height === 0) return;
  const width = canvas[0].length;

  // Create a copy of the canvas to avoid modifying while iterating
  const original = canvas.map((row) => [...row]);

  // Identify rows that look like application lines (horizontal lines in the bottom third)
  const applicationRows = [];
  for (let y = Math.floor((height * 2) / 3); y < height; y++) {
    let horizontalLineCount = 0;
    for (let x = 0; x < width; x++) {
      if (original[y][x] === '─') {
        horizontalLineCount++;
      }
    }

    // If this row has a significant number of horizontal lines, it's an application line
    if (horizontalLineCount > 3) {
      applicationRows.push(y);
    }
  }

  // Process each application line to add markers
  for (let i = 0; i < applicationRows.length; i++) {
    const y = applicationRows[i];

    // Find the start and end of horizontal lines
    let segments = [];
    let start = -1;

    for (let x = 0; x < width; x++) {
      if (original[y][x] === '─' && start === -1) {
        start = x;
      } else if (original[y][x] !== '─' && start !== -1) {
        segments.push({ start, end: x - 1 });
        start = -1;
      }
    }

    // Add the last segment if there is one
    if (start !== -1) {
      segments.push({ start, end: width - 1 });
    }

    // Add markers to the segments, but only if they're more than a few characters long
    for (const segment of segments) {
      if (segment.end - segment.start >= 5) {
        // Add markers (e.g., different style or character) at ends of application segments
        // to distinguish different applications visually
        const midpoint = Math.floor((segment.start + segment.end) / 2);
        if (midpoint > segment.start + 1 && midpoint < segment.end - 1) {
          // Add a distinct marker in the middle of longer application lines
          canvas[y][midpoint] = '┬'; // Top-facing T marker (or could use another distinct character)
        }
      }
    }
  }
}
