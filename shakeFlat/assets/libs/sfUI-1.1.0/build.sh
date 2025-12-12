#!/bin/bash

# sfUI Build Script
# Concatenates all source files into a single distributable file

echo "Building sfUI..."

# Define paths
SRC_DIR="src"
DIST_DIR="dist"
OUTPUT_JS_FILE="$DIST_DIR/sfui.js"
TEMP_FILE="$DIST_DIR/sfui.temp.js"

# Create dist directory if it doesn't exist
mkdir -p "$DIST_DIR"

# Concatenate all source files in order
cat > "$TEMP_FILE" << 'EOF'
/*!
 * sfUI - Unified UI Component Library
 * Version 1.0.0
 * Copyright (c) 2025
 * Licensed under MIT
 */

EOF

# Add all source files
cat "$SRC_DIR/sfui.core.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$SRC_DIR/sfui.alert.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$SRC_DIR/sfui.modal.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$SRC_DIR/sfui.lightbox.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$SRC_DIR/sfui.rangeslider.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$SRC_DIR/sfui.sidebar.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$SRC_DIR/sfui.notice.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$SRC_DIR/sfui.main.js" >> "$TEMP_FILE"

# Copy to sfui.js
mv "$TEMP_FILE" "$OUTPUT_JS_FILE"

echo "✓ Build complete: $OUTPUT_JS_FILE"
echo "✓ CSS file: $DIST_DIR/sfui.css"

# Show file sizes
echo ""
echo "File sizes:"
ls -lh "$DIST_DIR/sfui.js" | awk '{print "  JS:  " $5}'
ls -lh "$DIST_DIR/sfui.css" | awk '{print "  CSS: " $5}'

echo ""
echo "Build finished successfully!"
