#!/bin/bash

# Test goal creation functionality from the command line
# This script creates a test goal with a timestamp in the description
# to ensure uniqueness, then verifies the goal was created properly

echo "===== Testing Goal Creation API ====="

# Create a goal with unique timestamp in description
TIMESTAMP=$(date +%s)
GOAL_DESCRIPTION="Test Goal $TIMESTAMP"
TARGET_VALUE=100
UNIT="pages"
DEADLINE="2025-04-15"
CATEGORY_ID=2
REMINDER="weekly"

echo "Creating goal with description: $GOAL_DESCRIPTION"

# Create the goal via API
CREATE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"description\": \"$GOAL_DESCRIPTION\", \"targetValue\": $TARGET_VALUE, \"unit\": \"$UNIT\", \"deadline\": \"$DEADLINE\", \"categoryId\": $CATEGORY_ID, \"reminderFrequency\": \"$REMINDER\"}" \
  http://localhost:5000/api/goals)

# Check if curl command succeeded
if [ $? -ne 0 ]; then
  echo "Failed to execute curl command"
  exit 1
fi

# Extract the goal ID from the response
GOAL_ID=$(echo $CREATE_RESPONSE | jq -r '.id')

# Check if we got a valid goal ID
if [ -z "$GOAL_ID" ] || [ "$GOAL_ID" == "null" ]; then
  echo "Failed to create goal. Response:"
  echo $CREATE_RESPONSE | jq .
  exit 1
fi

echo "Goal created successfully with ID: $GOAL_ID"

# Fetch all goals to verify the goal exists
echo "Fetching all goals to verify creation..."
GET_RESPONSE=$(curl -s -X GET -H "Content-Type: application/json" http://localhost:5000/api/goals)

# Find our created goal in the list
FOUND_GOAL=$(echo $GET_RESPONSE | jq --arg desc "$GOAL_DESCRIPTION" '.[] | select(.description==$desc)')

if [ -z "$FOUND_GOAL" ]; then
  echo "ERROR: Created goal not found in the goals list"
  echo "All goals:"
  echo $GET_RESPONSE | jq .
  exit 1
fi

echo "Goal verification successful. Goal details:"
echo $FOUND_GOAL | jq .

# Create a JSON test result object
TEST_RESULT=$(cat <<EOF
{
  "id": "goal-creation",
  "name": "Goal Creation Test",
  "description": "Verifies that users can create new goals with valid input via the API",
  "status": "passed",
  "duration": $(($(date +%s%N)/1000000 - TIMESTAMP*1000)),
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
)

# Save the test result for later use
echo $TEST_RESULT > /tmp/goal_creation_test_result.json
echo "Test result saved to /tmp/goal_creation_test_result.json"

echo ""
echo "===== Goal Creation Test Passed! ====="
exit 0