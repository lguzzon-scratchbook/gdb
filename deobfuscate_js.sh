#!/bin/bash

# Check if source directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <sourceDir>"
    echo "Example: $0 /path/to/js/files"
    exit 1
fi

sourceDir="$1"
newDir="${sourceDir}_NEW"

# Check if source directory exists
if [ ! -d "$sourceDir" ]; then
    echo "Error: Directory '$sourceDir' does not exist."
    exit 1
fi

# Create the new directory
mkdir -p "$newDir"

echo "Processing JavaScript files from '$sourceDir' to '$newDir'..."

# Find all .js files in the source directory
find "$sourceDir" -name "*.js" -type f | while read -r jsFile; do
    echo "Processing: $jsFile"

    # Get the base filename without path
    baseFileName=$(basename "$jsFile")

    # Run webcrack command
    if bunx --bun webcrack "$jsFile" -o "${newDir}/TEMP" --force &>/dev/null; then
        # Check if the deobfuscated file was created
        deobfuscatedFile="${newDir}/TEMP/deobfuscated.js"
        targetFile="${newDir}/${baseFileName}"

        if [ -f "$deobfuscatedFile" ]; then
            # Rename the deobfuscated file to the original filename
            mv "$deobfuscatedFile" "$targetFile"
            echo "✓ Successfully processed and renamed: $baseFileName"
        else
            echo "⚠ Warning: Deobfuscated file not found for: $baseFileName"
        fi
    else
        echo "✗ Error processing: $jsFile"
    fi
done
if [ -d "${newDir}/TEMP" ]; then
    echo "directory \"${newDir}/TEMP\" exists"
    rm -r "${newDir}/TEMP"
fi

if [ -f "$sourceDir/biome.jsom" ]; then
    echo "File \"$sourceDir/biome.jsom\" exists"
    cp "$sourceDir/biome.jsom" "${newDir}/"
fi

cd "${newDir}" || exit
bunx @biomejs/biome check --write --unsafe .
cd ..
echo "Processing complete. Results are in '$newDir'"
