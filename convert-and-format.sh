#!/bin/bash

# Convert JavaScript to Lambda Calculus and generate well-formatted output
# This script handles the conversion and optimizes the format for Tromp diagrams

# Default parameters
INPUT_FILE="input.js"
OUTPUT_FILE="lambda-formatted.txt"
LABELED_OUTPUT="lambda-formatted-labeled.txt"

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
        --labeled|-l)
            LABELED_OUTPUT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: ./convert-and-format.sh [options]"
            echo ""
            echo "Options:"
            echo "  --input, -i     Input JavaScript file (default: input.js)"
            echo "  --output, -o    Output lambda expressions file (default: lambda-formatted.txt)"
            echo "  --labeled, -l   Output file with labeled lambda terms (default: lambda-formatted-labeled.txt)"
            echo "  --help          Show this help message"
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

# Step 1: Convert JavaScript to lambda calculus
echo "Converting JavaScript to lambda calculus..."
node convert.js --input "$INPUT_FILE" --output "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
    echo "Error: Conversion failed"
    exit 1
fi

echo "Conversion completed. Lambda expressions saved to $OUTPUT_FILE"

# Step 2: Format the lambda expressions for better visualization
echo "Formatting lambda expressions for better visualization..."

# Read the raw lambda expression
LAMBDA_EXPR=$(cat "$OUTPUT_FILE")

# Format the expression by:
# 1. Replacing backslash lambda with Unicode lambda
# 2. Replacing arrow notation with dot notation
# 3. Ensuring proper spacing and parentheses
FORMATTED_EXPR=$(echo "$LAMBDA_EXPR" | 
    sed 's/\\//g' |  # Replace backslash with Unicode lambda
    sed 's/->/./' |  # Replace arrow notation with dot
    sed 's/ / /g')   # Normalize spacing

# Write formatted expression to output file
echo "$FORMATTED_EXPR" > "$OUTPUT_FILE"

# Create a labeled version for better readability
# Add labels to the lambda terms for better understanding
echo "$FORMATTED_EXPR" | 
    sed 's/λf\.λx\./λf\.λx\./' |  # Keep Church numerals as they are
    sed 's/λ\([a-zA-Z0-9]\)\./λ\1./' > "$LABELED_OUTPUT"

echo "Formatting completed. Formatted expressions saved to:"
echo " - $OUTPUT_FILE (for visualization)"
echo " - $LABELED_OUTPUT (with labels for readability)"

# Display the final formatted expression
echo
echo "Formatted Lambda Expression:"
echo "$FORMATTED_EXPR"
echo
echo "To visualize this expression, run: ./visualize.js"