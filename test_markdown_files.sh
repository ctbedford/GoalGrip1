#!/bin/bash

# Test script to verify markdown file accessibility via the debug API

echo "Testing Markdown Files Access"

# Get list of markdown files
echo "Checking available markdown files..."
MARKDOWN_LIST=$(curl -s http://localhost:5000/api/debug/markdown)

# Display the list
echo "Available markdown files:"
echo $MARKDOWN_LIST | jq .

# Test fetching our goal_creation.md file
echo ""
echo "Fetching goal_creation.md content..."
GOAL_CREATION_MD=$(curl -s http://localhost:5000/api/debug/markdown/goal_creation.md)

# Check if we got content
if [[ -z "$GOAL_CREATION_MD" || "$GOAL_CREATION_MD" == *"error"* ]]; then
  echo "Failed to fetch goal_creation.md content. Response:"
  echo $GOAL_CREATION_MD | jq .
  exit 1
fi

echo "Successfully retrieved goal_creation.md content:"
echo $GOAL_CREATION_MD | jq .

echo ""
echo "Markdown file tests completed successfully!"
exit 0