# Dashboard Tests Plan

## Overview
This document outlines a comprehensive testing strategy for the dashboard functionality of the GOAL:SYNC application. The dashboard is the primary interface for users to view their goals, track progress, and manage action items.

## Test Categories

### 1. Dashboard API Tests

#### Stats API Tests
- **Test ID**: `dashboard-stats-api`
- **Description**: Verifies the `/api/dashboard/stats` endpoint returns correct statistics.
- **Test Cases**:
  - Empty state (no goals)
  - With active goals
  - With completed goals
  - With points earned

#### Goals API Tests
- **Test ID**: `dashboard-goals-api`
- **Description**: Verifies the `/api/goals` endpoint returns correctly formatted goals with categories.
- **Test Cases**:
  - Empty state (no goals)
  - Multiple goals with different categories
  - Completed vs. active goals filtering

#### Action Items API Tests
- **Test ID**: `dashboard-action-items-api`
- **Description**: Verifies the `/api/action-items` endpoint returns action items linked to goals.
- **Test Cases**:
  - Empty state (no action items)
  - Multiple action items
  - Filtering by completion status

### 2. UI Component Tests

#### Stats Card Tests
- **Test ID**: `dashboard-stats-card`
- **Description**: Verifies the Stats Card component renders correctly with different data.
- **Test Cases**:
  - Rendering with valid data
  - Zero value handling
  - Progress bar calculation

#### Goal Card Tests
- **Test ID**: `dashboard-goal-card`
- **Description**: Verifies the Goal Card component renders correctly with different goal data.
- **Test Cases**:
  - Rendering with valid goal data
  - Progress calculation
  - Category color display
  - Deadline formatting

#### Action Item Card Tests
- **Test ID**: `dashboard-action-item-card`
- **Description**: Verifies the Action Item Card component renders correctly.
- **Test Cases**:
  - Rendering with valid item data
  - Completed vs. incomplete state
  - Action buttons functionality

#### Insight Card Tests
- **Test ID**: `dashboard-insight-card`
- **Description**: Verifies the Insight Card component renders correctly with different types.
- **Test Cases**:
  - Info type rendering
  - Warning type rendering
  - Success type rendering
  - Icon display

### 3. Integration Tests

#### Dashboard Loading State
- **Test ID**: `dashboard-loading-state`
- **Description**: Verifies the dashboard shows appropriate loading states while fetching data.
- **Test Cases**:
  - Skeleton loaders visibility during API calls
  - Transition from loading to loaded state

#### Dashboard Empty State
- **Test ID**: `dashboard-empty-state`
- **Description**: Verifies the dashboard shows appropriate empty states when no data is available.
- **Test Cases**:
  - No goals empty state
  - No action items empty state
  - Create goal CTA button functionality

#### Dashboard Data Integration
- **Test ID**: `dashboard-data-integration`
- **Description**: Verifies the dashboard correctly integrates and displays data from multiple API endpoints.
- **Test Cases**:
  - Stats, goals, and action items data integration
  - Filtering of active goals
  - Quick update section functionality

#### Create Goal Modal
- **Test ID**: `dashboard-create-goal-modal`
- **Description**: Verifies the Create Goal modal functionality from the dashboard.
- **Test Cases**:
  - Modal opening from multiple entry points
  - Form validation
  - Goal creation and dashboard refresh

### 4. End-to-end Tests

#### Dashboard Workflow
- **Test ID**: `dashboard-e2e-workflow`
- **Description**: Tests the complete user journey through the dashboard.
- **Test Cases**:
  - Empty state → Create goal → View goal on dashboard
  - Update goal progress → See stats update
  - Complete goal → See completion reflected in stats
  - Create multiple goals → See dashboard organization

## Implementation Plan

1. Create API testing scripts using curl commands:
```bash
#!/bin/bash
# test_dashboard_api.sh

# Test dashboard stats API
echo "Testing dashboard stats API..."
STATS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/dashboard/stats)
echo $STATS_RESPONSE | jq .

# Test goals API
echo "Testing goals API..."
GOALS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/goals)
echo $GOALS_RESPONSE | jq .

# Test action items API
echo "Testing action items API..."
ACTIONS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/action-items)
echo $ACTIONS_RESPONSE | jq .
```

2. Create component tests in the client:
```typescript
// In client/src/lib/tests/dashboard-components.ts

// Sample test for StatsCard
registerFeatureTest({
  id: "dashboard-stats-card",
  name: "Dashboard Stats Card Test",
  description: "Verifies stats card renders correctly with different data",
  area: FeatureArea.DASHBOARD,
  featureName: "dashboard-stats",
  async test(contextId?) {
    // Implementation logic for testing component rendering
    // Will need to be integrated with a test renderer
    return true;
  }
});
```

3. Integrate tests with the debug infrastructure:
```typescript
// In register_dashboard_test_result.sh

#!/bin/bash
# Register test result for dashboard features

# Create a test result JSON
TEST_RESULT=$(cat <<EOF
{
  "id": "dashboard-stats-api",
  "name": "Dashboard Stats API Test",
  "description": "Verifies the dashboard stats API returns correct data",
  "status": "passed",
  "duration": 150,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
)

# Send it to the debug API
curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"query\": \"updateFeatureTestStatus\", \"featureName\": \"dashboard-stats\", \"tested\": true, \"testResult\": $TEST_RESULT}" \
  http://localhost:5000/api/debug/query
```

## Future Enhancements

- Add automated screenshot testing for visual components
- Implement performance testing for dashboard loading time
- Create accessibility tests for dashboard components
- Add cross-browser compatibility tests