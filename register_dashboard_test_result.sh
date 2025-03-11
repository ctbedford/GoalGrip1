#!/bin/bash

# Register test results for dashboard features
# This script registers test results for the dashboard features with the debug infrastructure

FEATURE_NAME="dashboard-stats"
TEST_RESULT_FILE="/tmp/dashboard_api_test_result.json"

# Check if the test result file exists
if [ ! -f "$TEST_RESULT_FILE" ]; then
  echo "ERROR: Test result file not found at $TEST_RESULT_FILE"
  echo "Please run test_dashboard_api.sh first to generate test results"
  exit 1
fi

# Read the test result JSON
TEST_RESULT=$(cat $TEST_RESULT_FILE)

echo "Recording test result for $FEATURE_NAME..."
echo $TEST_RESULT | jq .

# Get the current feature status before update
echo "Feature status before update:"
FEATURE_STATUS=$(curl -s "http://localhost:5000/api/debug/features/$FEATURE_NAME")
echo $FEATURE_STATUS | jq .

# Send test result to the debug API
echo "Update result:"
UPDATE_RESULT=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"query\": \"updateFeatureTestStatus\", \"parameters\": {\"featureName\": \"$FEATURE_NAME\", \"tested\": true, \"testResult\": $TEST_RESULT}}" \
  http://localhost:5000/api/debug/query)
echo $UPDATE_RESULT | jq .

# Get the updated feature status
echo "Feature status after update:"
UPDATED_FEATURE=$(curl -s "http://localhost:5000/api/debug/features/$FEATURE_NAME")
echo $UPDATED_FEATURE | jq .

echo "Test result has been registered successfully!"
exit 0