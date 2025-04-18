#!/usr/bin/env node
/**
 * Main command-line tool for jambda-calc - runs transpilation and/or visualization
 */
import fs from 'fs';
import path from 'path';
import { transpile } from '../lib/transpiler';
import { visualize, renderSVGAsASCII } from '../lib/visualizer';
import { execSync } from 'child_process';

const args = process.argv.slice(2);

let inputFile = '';
let outputFile: string | null = null;
let outputDir: string | null = null;
let format = 'svg';
let shouldVisualize = false;
let lambdaInput = false;
let width = 1200;
let height = 800;

function showHelp(): void {
  console.log('Usage: jambda-calc [options]\n');
  console.log('Commands:');
  console.log('  examples          Run built-in examples with explanations\n');
  console.log('Options:');
  console.log('  --input, -i       Input JavaScript/TypeScript file (default: input.js)');
  console.log(
    '  --lambda-input, -l Input file containing lambda calculus expressions (skips transpilation)'
  );
  console.log('  --output, -o      Output lambda expression file (optional)');
  console.log('  --visualize, -v   Visualize the lambda expression (default: false)');
  console.log(
    '  --output-dir      Output directory for diagram files (if not provided, displays in console)'
  );
  console.log('  --format, -f      Output format for diagrams: svg (default) or png');
  console.log('  --width, -w       Width of the diagram in pixels (default: 1200)');
  console.log('  --height, -h      Height of the diagram in pixels (default: 800)');
  console.log('  --help            Show this help message');
}

if (args.length === 1 && args[0] === 'examples') {
  try {
    const examplesScript = path.join(__dirname, '../lib/scripts/run-examples.js');
    // Use node directly on the script file instead of execSync to avoid duplication
    require(examplesScript);
    process.exit(0);
  } catch (error) {
    console.error(
      'Error running examples:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--input' || args[i] === '-i') {
    if (i + 1 < args.length) {
      inputFile = args[i + 1];
      i++;
    }
  } else if (args[i] === '--lambda-input' || args[i] === '--lambda' || args[i] === '-l') {
    if (i + 1 < args.length) {
      inputFile = args[i + 1];
      lambdaInput = true;
      i++;
    }
  } else if (args[i] === '--output' || args[i] === '-o') {
    if (i + 1 < args.length) {
      outputFile = args[i + 1];
      i++;
    }
  } else if (args[i] === '--visualize' || args[i] === '-v') {
    shouldVisualize = true;
  } else if (args[i] === '--output-dir') {
    if (i + 1 < args.length) {
      outputDir = args[i + 1];
      i++;
    }
  } else if (args[i] === '--format' || args[i] === '-f') {
    if (i + 1 < args.length) {
      format = args[i + 1].toLowerCase();
      i++;
    }
  } else if (args[i] === '--width' || args[i] === '-w') {
    if (i + 1 < args.length) {
      width = parseInt(args[i + 1]);
      i++;
    }
  } else if (args[i] === '--height') {
    if (i + 1 < args.length) {
      height = parseInt(args[i + 1]);
      i++;
    }
  } else if (args[i] === '--help') {
    showHelp();
    process.exit(0);
  }
}

// used in terminal outputs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  purple: '\x1b[35m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

async function main(): Promise<void> {
  try {
    if (inputFile === '') return;
    const inputContent = fs.readFileSync(inputFile, 'utf-8');

    let lambdaExpression;
    //// 1. TRANSPILE (OR SKIP) ////
    if (lambdaInput) {
      // if running visualization only
      lambdaExpression = inputContent.trim();
      console.log(`${colors.gray}Using lambda expression from ${inputFile}${colors.reset}`);
    } else {
      // if running transpile
      lambdaExpression = transpile(inputContent);

      if (outputFile) {
        const outputFileDir = path.dirname(outputFile);
        if (!fs.existsSync(outputFileDir)) {
          fs.mkdirSync(outputFileDir, { recursive: true });
        }

        fs.writeFileSync(outputFile, lambdaExpression, 'utf-8');
        console.log(
          `${colors.gray}Lambda calculus notation written to ${outputFile}${colors.reset}`
        );
      }
    }

    console.log(
      `\n${colors.bright}${colors.purple}λ Expression:\n${colors.reset} ${colors.purple}${lambdaExpression
        .replace(/\\/g, 'λ')
        .replace(/->/g, '.')
        .replace(/\(\(([^()]*)\)\)/g, '($1)')}${colors.reset}\n`
    );

    //// 2: VISUALIZE (OR SKIP) ////
    if (shouldVisualize) {
      const options = {
        unitSize: 12,
        lineWidth: 2,
        padding: 10,
        width: width,
        height: height,
        backgroundColor: '#282a36',
        preserveAspectRatio: true,
      };

      // handles saving the file as svg or png (which ever is passed in)
      let svgContent;
      if (outputDir) {
        svgContent = visualize(
          lambdaExpression,
          options,
          path.join(outputDir, `${path.basename(inputFile, path.extname(inputFile))}.${format}`),
          format
        );
        const outputPath = path.join(
          outputDir,
          `${path.basename(inputFile, path.extname(inputFile))}.${format}`
        );
        console.log(`${colors.gray}Generated diagram: ${outputPath}${colors.reset}`);
      } else {
        svgContent = visualize(lambdaExpression, options);
        try {
          // if no output dir is specified, just print the ascii version in the console
          const asciiDiagram = renderSVGAsASCII(svgContent);
          console.log(`\n${colors.bright}${colors.white}John Tromp Diagram${colors.reset}\n`);
          console.log(colors.white + asciiDiagram + colors.reset);
          console.log(
            `\n${colors.yellow}Note: Use --output-dir to save a graphical SVG/PNG version.${colors.reset}`
          );
        } catch (err) {
          console.error(`${colors.red}Error rendering ASCII diagram:${colors.reset}`, err);
          console.log(
            `${colors.yellow}Use --output-dir to save a graphical SVG/PNG version.${colors.reset}`
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `${colors.red}Error:${colors.reset}`,
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
