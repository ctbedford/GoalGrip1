#!/bin/bash

# Test script for Dashboard API endpoints
# This script verifies that all dashboard-related API endpoints
# are functioning correctly and returning the expected data structure

echo "===== Testing Dashboard API Endpoints ====="

# Start timestamp for test duration calculation
START_TIME=$(date +%s%N)

# 1. Test dashboard stats API
echo -e "\n1. Testing dashboard stats API..."
STATS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/dashboard/stats)

# Check if successful response
if [ $? -ne 0 ]; then
  echo "Failed to execute curl command for dashboard stats"
  exit 1
fi

# Verify response has required fields
ACTIVE_GOALS=$(echo $STATS_RESPONSE | jq -r '.activeGoals')
COMPLETED_GOALS=$(echo $STATS_RESPONSE | jq -r '.completedGoals')
POINTS_EARNED=$(echo $STATS_RESPONSE | jq -r '.pointsEarned')

if [ -z "$ACTIVE_GOALS" ] || [ -z "$COMPLETED_GOALS" ] || [ -z "$POINTS_EARNED" ]; then
  echo "ERROR: Dashboard stats endpoint missing required fields"
  echo "Response:"
  echo $STATS_RESPONSE | jq .
  exit 1
fi

echo "Dashboard stats API returned valid data:"
echo $STATS_RESPONSE | jq .

# 2. Test goals API
echo -e "\n2. Testing goals API..."
GOALS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/goals)

# Check if successful response
if [ $? -ne 0 ]; then
  echo "Failed to execute curl command for goals"
  exit 1
fi

# Verify response structure
if ! echo $GOALS_RESPONSE | jq -e 'if type == "array" then true else false end' > /dev/null; then
  echo "ERROR: Goals endpoint did not return an array"
  echo "Response:"
  echo $GOALS_RESPONSE
  exit 1
fi

echo "Goals API returned valid data:"
echo $GOALS_RESPONSE | jq .

# 3. Test action items API
echo -e "\n3. Testing action items API..."
ACTIONS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/action-items)

# Check if successful response
if [ $? -ne 0 ]; then
  echo "Failed to execute curl command for action items"
  exit 1
fi

# Verify response structure
if ! echo $ACTIONS_RESPONSE | jq -e 'if type == "array" then true else false end' > /dev/null; then
  echo "ERROR: Action items endpoint did not return an array"
  echo "Response:"
  echo $ACTIONS_RESPONSE
  exit 1
fi

echo "Action items API returned valid data:"
echo $ACTIONS_RESPONSE | jq .

# 4. Test categories API
echo -e "\n4. Testing categories API..."
CATEGORIES_RESPONSE=$(curl -s -X GET http://localhost:5000/api/categories)

# Check if successful response
if [ $? -ne 0 ]; then
  echo "Failed to execute curl command for categories"
  exit 1
fi

# Verify response structure
if ! echo $CATEGORIES_RESPONSE | jq -e 'if type == "array" then true else false end' > /dev/null; then
  echo "ERROR: Categories endpoint did not return an array"
  echo "Response:"
  echo $CATEGORIES_RESPONSE
  exit 1
fi

echo "Categories API returned valid data:"
echo $CATEGORIES_RESPONSE | jq .

# Calculate test duration
END_TIME=$(date +%s%N)
DURATION=$(( ($END_TIME - $START_TIME) / 1000000 )) # Convert to milliseconds

# Create a JSON test result object
TEST_RESULT=$(cat <<EOF
{
  "id": "dashboard-api-test",
  "name": "Dashboard API Test",
  "description": "Verifies all dashboard-related API endpoints return correct data structures",
  "status": "passed",
  "duration": $DURATION,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
)

# Save the test result for later use
echo $TEST_RESULT > /tmp/dashboard_api_test_result.json
echo -e "\nTest result saved to /tmp/dashboard_api_test_result.json"

echo -e "\n===== Dashboard API Tests Passed! ====="
exit 0