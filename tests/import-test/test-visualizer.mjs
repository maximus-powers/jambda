import { parse } from '../../dist/index.js';
import { LambdaVisualizer, renderSVGAsASCII } from '../../dist/lib/visualizer/index.js';

const jsCode = `
function add(a, b) {
  return a + b;
}`;

// Convert to lambda calculus
const lambdaExpression = parse(jsCode);

// Create a visualizer
const visualizer = new LambdaVisualizer({
  // Optional configuration
  unitSize: 12,
  backgroundColor: '#282a36',
  showLabels: true
});

// Generate SVG visualization
const svgContent = visualizer.visualize(lambdaExpression);

// For ASCII visualization in terminal
const asciiArt = renderSVGAsASCII(svgContent);
console.log(asciiArt);