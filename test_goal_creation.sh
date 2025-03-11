#!/bin/bash

# Test script for goal creation API
echo "Starting Goal Creation Feature Test"

# Generate a unique description for this test
TEST_ID=$(date +%s)
GOAL_DESCRIPTION="Test Goal $TEST_ID"

# Create a goal via the API
echo "Creating goal: $GOAL_DESCRIPTION"
CREATE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"description\": \"$GOAL_DESCRIPTION\", \"targetValue\": 100, \"unit\": \"pages\", \"deadline\": \"2025-04-15\", \"categoryId\": 2, \"reminderFrequency\": \"weekly\"}" \
  http://localhost:5000/api/goals)

# Check if goal was created successfully by getting the ID
GOAL_ID=$(echo $CREATE_RESPONSE | jq -r '.id')

if [[ "$GOAL_ID" == "null" || -z "$GOAL_ID" ]]; then
  echo "Failed to create goal. API response:"
  echo $CREATE_RESPONSE | jq .
  exit 1
fi

echo "Goal created with ID: $GOAL_ID"

# Verify the goal exists by fetching it
echo "Verifying goal exists..."
GET_RESPONSE=$(curl -s -X GET -H "Content-Type: application/json" http://localhost:5000/api/goals)
FOUND_GOAL=$(echo $GET_RESPONSE | jq --arg desc "$GOAL_DESCRIPTION" '.[] | select(.description==$desc)')

if [[ -z "$FOUND_GOAL" ]]; then
  echo "Failed to verify goal. Goal not found in the list."
  echo "API response:"
  echo $GET_RESPONSE | jq .
  exit 1
fi

echo "Goal verification successful:"
echo $FOUND_GOAL | jq .

# Test passed
echo "Goal Creation Test: PASSED"
exit 0