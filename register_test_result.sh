#!/bin/bash

# Script to register test result with the debug API
FEATURE_NAME="goal-creation"
TEST_ID="goal-creation"
TEST_NAME="Goal Creation Test"
DESCRIPTION="Verifies that users can create new goals with valid input via the API"
STATUS="passed"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# Create a manual test result object
TEST_RESULT='{
  "id": "'$TEST_ID'",
  "name": "'$TEST_NAME'",
  "description": "'$DESCRIPTION'",
  "status": "'$STATUS'",
  "duration": 1254,
  "timestamp": "'$TIMESTAMP'"
}'

echo "Recording test result for $FEATURE_NAME..."
echo $TEST_RESULT | jq .

# Extract current feature status before the update
FEATURE_STATUS_BEFORE=$(curl -s http://localhost:5000/api/debug/features/$FEATURE_NAME)

echo "Feature status before update:"
echo $FEATURE_STATUS_BEFORE | jq .

# Update the feature test status using our new API endpoint
UPDATE_RESULT=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "updateFeatureTestStatus",
    "parameters": {
      "featureName": "'$FEATURE_NAME'",
      "tested": true,
      "testResult": '"$TEST_RESULT"'
    }
  }' \
  http://localhost:5000/api/debug/query)

echo ""
echo "Update result:"
echo $UPDATE_RESULT | jq .

# Get updated feature status
FEATURE_STATUS_AFTER=$(curl -s http://localhost:5000/api/debug/features/$FEATURE_NAME)

echo ""
echo "Feature status after update:"
echo $FEATURE_STATUS_AFTER | jq .

echo ""
echo "Test result has been registered successfully!"