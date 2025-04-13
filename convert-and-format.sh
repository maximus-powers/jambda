#!/bin/bash
# Simple shell script to run the full conversion process

# Check for input file argument
INPUT_FILE=${1:-./input.js}
OUTPUT_FILE=${2:-./lambda-formatted.txt}

# Temporary file for the intermediate output
TEMP_OUTPUT="./lambda-parsed.js"
TEMP_FORMAT_INPUT="./lambda-output.txt"

echo "Converting $INPUT_FILE to Lambda Calculus..."
node convert.js "$INPUT_FILE" "$TEMP_OUTPUT"

if [ $? -ne 0 ]; then
  echo "Error: Conversion failed!"
  exit 1
fi

echo "Copying parsed output to formatter input..."
cp "$TEMP_OUTPUT" "$TEMP_FORMAT_INPUT"

echo "Formatting to mathematical notation..."
node lambda-format.js "$TEMP_FORMAT_INPUT" "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
  echo "Error: Formatting failed!"
  exit 1
fi

echo "Conversion complete! Result saved to $OUTPUT_FILE:"
echo "---------------------------------------------"
cat "$OUTPUT_FILE"
echo "---------------------------------------------"
echo "Done!"