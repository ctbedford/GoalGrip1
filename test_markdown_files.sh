#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Define base URL - adjust as needed
BASE_URL="http://localhost:5000"

# List of all markdown files to test
MARKDOWN_FILES=(
  "API_STANDARDS.md"
  "API_TESTING.md"
  "CONTRIBUTING.md"
  "DEBUG_INFRASTRUCTURE.md"
  "FEATURE_TESTING.md"
  "IMPLEMENTATION_ANALYSIS.md"
  "README.md"
  "UNIFIED_DEBUG_IMPLEMENTATION.md"
)

# Print test header
echo -e "${YELLOW}=== Testing Markdown File Access ===${NC}"
echo -e "${YELLOW}Testing ${#MARKDOWN_FILES[@]} markdown files against ${BASE_URL}${NC}\n"

# Counter for successful tests
SUCCESS_COUNT=0

# Test each markdown file
for file in "${MARKDOWN_FILES[@]}"; do
  echo -e "Testing ${YELLOW}${file}${NC}..."
  
  # Make request and capture status code and response
  HTTP_STATUS=$(curl -s -o /tmp/md_response -w "%{http_code}" ${BASE_URL}/${file})
  RESPONSE_SIZE=$(stat -c%s /tmp/md_response)
  
  # Check status code
  if [ "$HTTP_STATUS" -eq 200 ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo -e "  Status: ${GREEN}${HTTP_STATUS}${NC}"
    echo -e "  Size: ${GREEN}${RESPONSE_SIZE} bytes${NC}"
    
    # Show first few lines of content
    echo -e "  Content snippet:"
    head -n 3 /tmp/md_response | while read line; do
      echo -e "    ${YELLOW}${line}${NC}"
    done
    
    echo -e "  ${GREEN}✓ Success${NC}\n"
  else
    echo -e "  Status: ${RED}${HTTP_STATUS}${NC}"
    echo -e "  ${RED}✗ Failed${NC}\n"
    cat /tmp/md_response
    echo -e "\n"
  fi
done

# Print summary
echo -e "${YELLOW}=== Test Summary ===${NC}"
if [ "$SUCCESS_COUNT" -eq "${#MARKDOWN_FILES[@]}" ]; then
  echo -e "${GREEN}All markdown files (${SUCCESS_COUNT}/${#MARKDOWN_FILES[@]}) are accessible!${NC}"
else
  echo -e "${RED}${SUCCESS_COUNT}/${#MARKDOWN_FILES[@]} markdown files are accessible.${NC}"
fi

# Add curl commands for debugging and documentation
echo -e "\n${YELLOW}=== Curl Commands for API Documentation ===${NC}"
echo -e "# Example curl commands to access markdown files:"
echo -e "curl -X GET ${BASE_URL}/README.md"
echo -e "curl -X GET ${BASE_URL}/API_STANDARDS.md"
echo -e "curl -X GET ${BASE_URL}/UNIFIED_DEBUG_IMPLEMENTATION.md"

# Add commands for the Debug API
echo -e "\n${YELLOW}=== Debug API Integration ===${NC}"
echo -e "# Get available debug functions:"
echo -e "curl -X GET ${BASE_URL}/api/debug"
echo -e "\n# Create a debug query to list available markdown files:"
echo -e "curl -X POST ${BASE_URL}/api/debug/query \\"
echo -e "  -H \"Content-Type: application/json\" \\"
echo -e "  -d '{\"query\": \"listMarkdownFiles()\"}'"