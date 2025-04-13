#!/bin/bash

# Convert and visualize JavaScript functions as lambda calculus expressions

# Default parameters
INPUT_FILE="input.js"
OUTPUT_FILE="lambda-formatted.txt"
DIAGRAM_DIR="diagrams"
FORMAT="png"
SHOW_LABELS=false
HIDE_APP_SYMBOLS=true
WIDTH=1200
HEIGHT=800

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --input|-i)
            INPUT_FILE="$2"
            shift 2
            ;;
        --output|-o)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --diagrams|-d)
            DIAGRAM_DIR="$2"
            shift 2
            ;;
        --format|-f)
            FORMAT="$2"
            shift 2
            ;;
        --labels|-l)
            SHOW_LABELS=true
            shift
            ;;
        --show-app-symbols)
            HIDE_APP_SYMBOLS=false
            shift
            ;;
        --hide-app-symbols)
            HIDE_APP_SYMBOLS=true
            shift
            ;;
        --width|-w)
            WIDTH="$2"
            shift 2
            ;;
        --height|-h)
            HEIGHT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: ./convert-and-visualize.sh [options]"
            echo ""
            echo "Options:"
            echo "  --input, -i          Input JavaScript file (default: input.js)"
            echo "  --output, -o         Output lambda expressions file (default: lambda-formatted.txt)"
            echo "  --diagrams, -d       Output directory for diagrams (default: diagrams)"
            echo "  --format, -f         Output format: svg or png (default: png)"
            echo "  --labels, -l         Show term labels in the diagram"
            echo "  --hide-app-symbols   Hide application (@) symbols (default)"
            echo "  --show-app-symbols   Show application (@) symbols"
            echo "  --width, -w          Width of the output image in pixels (default: 1200)"
            echo "  --height, -h         Height of the output image in pixels (default: 800)"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

# Step 1: Convert JavaScript to Lambda calculus
echo "Converting JavaScript to Lambda calculus..."

# Run the conversion script
node convert.js --input "$INPUT_FILE" --output "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
    echo "Error: Conversion failed"
    exit 1
fi

echo "Lambda calculus expression saved to $OUTPUT_FILE"

# Step 2: Generate diagrams
echo "Generating John Tromp diagrams..."

# Prepare label option
LABEL_OPT=""
if [ "$SHOW_LABELS" = true ]; then
    LABEL_OPT="--labels"
fi

# Prepare application symbols option
APP_SYMBOLS_OPT=""
if [ "$HIDE_APP_SYMBOLS" = true ]; then
    APP_SYMBOLS_OPT="--hide-app-symbols"
else
    APP_SYMBOLS_OPT="--show-app-symbols"
fi

# Generate diagrams
mkdir -p "$DIAGRAM_DIR"
node visualize.js --input "$OUTPUT_FILE" --output "$DIAGRAM_DIR" --format "$FORMAT" \
    --width "$WIDTH" --height "$HEIGHT" $LABEL_OPT $APP_SYMBOLS_OPT

if [ $? -ne 0 ]; then
    echo "Error: Diagram generation failed"
    exit 1
fi

echo "All diagrams have been generated in $DIAGRAM_DIR"

# Step 4: Display the diagram (macOS specific)
if [ "$FORMAT" = "png" ]; then
    echo "Opening the diagram..."
    open "$DIAGRAM_DIR/diagram_1.png"
elif [ "$FORMAT" = "svg" ]; then
    echo "Opening the diagram..."
    open "$DIAGRAM_DIR/diagram_1.svg"
fi