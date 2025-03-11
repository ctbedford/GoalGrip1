# AI Agent Debug Commands

This document provides detailed documentation for using debug commands with the Replit AI Agent to interact with the GOAL:SYNC application's debug infrastructure.

## Overview

The Replit AI Agent has been enhanced with specialized commands that enable it to interact with the application's debug infrastructure. These commands allow you to:

1. Query feature implementation status
2. Run tests on specific features or the entire application
3. Analyze performance metrics
4. Generate comprehensive status reports
5. Debug specific errors

These commands leverage the existing debug API to provide insights into the application's health, functionality, and performance.

## Command Reference

### Get Feature Status

**Command:** `!debug feature <feature_name>`

**Description:** Get detailed information about a specific feature, including its implementation status, test coverage, and recent changes.

**Parameters:**
- `feature_name`: The name of the feature to query (e.g., `goal-tracking`, `dashboard`, `analytics`)

**Examples:**

```
!debug feature goal-tracking
```

This will produce a report like:

```
## Goal Tracking Feature Status

**Implementation**: ✅ Complete
**Test Status**: ✅ 12/12 tests passing
**Last Verified**: March 10, 2025

### Recent Changes
- Added progress visualization (2 days ago)
- Fixed deadline calculation bug (5 days ago)

### Potential Issues
- Performance degrades with >100 goals

### Recommendations
- Consider implementing pagination for large goal sets
```

### Run Feature Tests

**Command:** `!debug test <feature_name> [--all]`

**Description:** Execute tests for a specific feature or all features and report the results, including any failures and suggested fixes.

**Parameters:**
- `feature_name`: The name of the feature to test (e.g., `goal-creation`, `user-authentication`)
- `--all`: Optional flag to run all tests instead of just those for a specific feature

**Examples:**

```
!debug test goal-creation
```

This will run tests for the goal creation feature and produce a report like:

```
## Running tests for Goal Creation feature...

✅ Goal creation with valid data: PASSED (120ms)
✅ Goal creation with categories: PASSED (130ms)
✅ Goal validation: PASSED (85ms)
❌ Goal creation with deadline: FAILED (210ms)

### Error Details
```
Expected deadline to be stored as ISO string, but was stored as Date object
at GoalService.createGoal (src/services/goal.service.ts:42:7)
```

### Suggested Fix
Add date conversion in the `createGoal` method:
```typescript
deadline: deadline instanceof Date ? deadline.toISOString() : deadline
```
```

### Analyze Performance

**Command:** `!debug perf <endpoint_or_feature> [--period=<time_period>]`

**Description:** Analyze performance metrics for a specific endpoint or feature, including response times, error rates, and throughput compared to historical baselines.

**Parameters:**
- `endpoint_or_feature`: The API endpoint (e.g., `/api/goals`) or feature name (e.g., `goal-tracking`) to analyze
- `--period`: Optional parameter to specify the time period for analysis (e.g., `1d`, `7d`, `30d`)

**Examples:**

```
!debug perf /api/goals --period=7d
```

This will produce a performance analysis report like:

```
## Performance Analysis: /api/goals

**Time Period**: Last 7 days
**Avg Response Time**: 87ms (↑5% from baseline)
**95th Percentile**: 210ms (↑12% from baseline)
**Error Rate**: 0.2% (↓30% from baseline)
**Throughput**: 120 req/min (peak)

### Anomalies Detected
- Response time spike on March 9, 2025 (320ms avg)
- Throughput drop on March 7, 2025 (40% below normal)

### Recommendations
- Investigate query optimization for goal filtering
- Consider adding caching for frequent queries
```

### Generate Status Report

**Command:** `!debug report [--detailed] [--format=<format>]`

**Description:** Generate a comprehensive status report of the application, including feature implementation status, test results, performance metrics, and critical issues.

**Parameters:**
- `--detailed`: Optional flag to include more detailed information in the report
- `--format`: Optional parameter to specify the output format (`markdown`, `json`, `text`)

**Examples:**

```
!debug report --detailed --format=markdown
```

This will generate a comprehensive status report like:

```
# GOAL:SYNC Application Status Report

## Summary
- **Features**: 24/25 implemented (96%)
- **Tests**: 142/150 passing (94.7%)
- **Performance**: Within acceptable parameters
- **Error Rate**: 0.3% (last 24 hours)

## Feature Status
| Feature | Implementation | Tests | Last Updated |
|---------|---------------|-------|--------------|
| Dashboard | Complete | 18/20 passing | Mar 10, 2025 |
| Goal Creation | Complete | 15/15 passing | Mar 8, 2025 |
| Goal Tracking | Complete | 20/20 passing | Mar 9, 2025 |
| Analytics | In Progress | 5/10 passing | Mar 7, 2025 |

## Critical Issues
1. Analytics dashboard fails to load with >50 goals
2. Intermittent 503 errors on progress update endpoint

## Recommendations
1. Prioritize completion of Analytics feature
2. Investigate progress update endpoint stability
3. Consider performance optimization for dashboard loading
```

### Debug Error

**Command:** `!debug error <error_id_or_message>`

**Description:** Analyze a specific error and suggest solutions based on error logs, stack traces, and known error patterns.

**Parameters:**
- `error_id_or_message`: The error ID or a portion of the error message to analyze

**Examples:**

```
!debug error TypeError: Cannot read property 'deadline' of undefined
```

This will produce an error analysis report like:

```
## Error Analysis

**Type**: TypeError
**Message**: Cannot read property 'deadline' of undefined
**Frequency**: 12 occurrences in last 24 hours
**Affected Endpoints**: `/api/goals/progress`, `/api/dashboard/stats`

### Context
This error occurs when trying to access the `deadline` property of a goal that doesn't exist.
The most common cause is attempting to process deleted goals that are still referenced.

### Recommended Fix
Add null checking before accessing goal properties:

```typescript
// Before
const daysLeft = calculateDaysLeft(goal.deadline);

// After
const daysLeft = goal ? calculateDaysLeft(goal.deadline) : 0;
```

### Related Issues
- This error may be related to the intermittent 503 errors on the progress update endpoint
- Consider implementing a cleanup routine to remove orphaned goal references
```

## Advanced Usage

### Combining Commands

You can combine multiple debug commands to gain deeper insights into the application:

```
!debug feature goal-tracking
!debug test goal-tracking
!debug perf /api/goals
```

This sequence will:
1. Check the current status of the goal tracking feature
2. Run tests to verify its functionality
3. Analyze the performance of the related API endpoint

### Using Command Output for Further Analysis

You can reference the output of one command in another command for deeper analysis:

```
!debug error [error from test output]
```

For example, if a test fails with a specific error, you can use the `!debug error` command to get more detailed information about that error.

### Continuous Monitoring

You can set up continuous monitoring of application health by regularly using the `!debug report` command:

```
!debug report --format=markdown
```

This will give you an up-to-date view of the application's status, helping you identify any issues that arise.

## Implementation Details

These commands are implemented using the application's debug API, which provides access to the following components:

1. **Enhanced Logger**: For detailed logging and tracing information
2. **Feature Tester**: For running tests and verifying functionality
3. **API Tester**: For testing API endpoints and analyzing responses
4. **Debug Storage**: For persistent storage of debug information
5. **Feature Status Tracking**: For monitoring implementation status

The AI agent intercepts these commands, calls the appropriate API endpoints, processes the responses, and formats the information in a user-friendly way.

## Extending the Command Set

The command set can be extended by adding new commands to the AI agent's repertoire. This involves:

1. **Defining the Command**: Specifying the command syntax and parameters
2. **Implementing the Handler**: Creating the logic to process the command
3. **Integrating with the Debug API**: Connecting the handler to the appropriate debug API endpoints

For example, to add a new command for analyzing user journey analytics, you would:

1. Define the command: `!debug journey <journey_name>`
2. Implement a handler that calls the appropriate API endpoints to gather user journey data
3. Process and format the response to provide insights into user behavior and potential issues

## Feedback and Improvements

The AI agent debug command system is designed to evolve based on user feedback and changing needs. If you have suggestions for new commands or improvements to existing ones, please submit them through the feedback form in the application.

Your feedback helps us enhance the AI agent's capabilities and provide better insights into the application's health and functionality.