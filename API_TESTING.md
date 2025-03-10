# API Testing Guide for GOAL:SYNC

This guide provides detailed examples for testing the GOAL:SYNC API, including common request patterns, expected responses, and troubleshooting tips.

## Table of Contents
- [API Testing Tools](#api-testing-tools)
- [Authentication](#authentication)
- [Testing User Operations](#testing-user-operations)
- [Testing Goal Operations](#testing-goal-operations)
- [Testing Progress Operations](#testing-progress-operations)
- [Testing Action Items](#testing-action-items)
- [Common Validation Errors](#common-validation-errors)
- [Troubleshooting](#troubleshooting)

## API Testing Tools

GOAL:SYNC provides built-in API testing utilities in `client/src/lib/apiTester.ts`:

```typescript
import { 
  testEndpoint,
  ApiEndpoint,
  testAllEndpoints,
  testGoalLifecycle
} from '@/lib/apiTester';
```

You can also use external tools like cURL, Postman, or Insomnia.

## Authentication

For the current MVP, authentication is simulated with a default `userId` of 1. The `requireAuth` middleware automatically adds this to protected routes.

When using external tools, add `userId: 1` to your request body for endpoints that require authentication.

## Testing User Operations

### Create a New User

#### Using apiTester:

```typescript
const result = await testEndpoint({
  endpoint: ApiEndpoint.USERS,
  method: 'POST',
  data: {
    username: "testuser",
    name: "Test User"
  }
});
```

#### Using cURL:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "name": "Test User"
  }'
```

#### Expected Response:

```json
{
  "id": 1,
  "username": "testuser",
  "name": "Test User",
  "points": 0,
  "level": 1
}
```

## Testing Goal Operations

### Get All Goals

#### Using apiTester:

```typescript
const result = await testEndpoint({
  endpoint: ApiEndpoint.GOALS,
  method: 'GET'
});
```

#### Using cURL:

```bash
curl -X GET http://localhost:3000/api/goals
```

### Create a Goal

#### Using apiTester:

```typescript
const result = await testEndpoint({
  endpoint: ApiEndpoint.GOALS,
  method: 'POST',
  data: {
    description: "Complete project documentation",
    targetValue: 100,
    unit: "percent",
    deadline: new Date().toISOString(),
    categoryId: 0,
    reminderFrequency: "weekly"
  }
});
```

#### Using cURL:

```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Complete project documentation",
    "targetValue": 100,
    "unit": "percent",
    "deadline": "2025-04-07T00:00:00.000Z",
    "categoryId": 0,
    "reminderFrequency": "weekly"
  }'
```

#### Expected Response:

```json
{
  "id": 1,
  "userId": 1,
  "description": "Complete project documentation",
  "targetValue": 100,
  "currentValue": 0,
  "unit": "percent",
  "deadline": "2025-04-07T00:00:00.000Z",
  "categoryId": 0,
  "reminderFrequency": "weekly",
  "completed": false,
  "createdAt": "2025-03-10T05:18:24.696Z"
}
```

### Update a Goal

#### Using apiTester:

```typescript
const result = await testEndpoint({
  endpoint: `${ApiEndpoint.GOAL_BY_ID.replace(':id', '1')}`,
  method: 'PATCH',
  data: {
    currentValue: 50
  }
});
```

#### Using cURL:

```bash
curl -X PATCH http://localhost:3000/api/goals/1 \
  -H "Content-Type: application/json" \
  -d '{
    "currentValue": 50
  }'
```

## Testing Progress Operations

### Log Progress for a Goal

#### Using apiTester:

```typescript
const result = await testEndpoint({
  endpoint: ApiEndpoint.PROGRESS_LOGS,
  method: 'POST',
  data: {
    goalId: 1,
    value: 25,
    notes: "Made good progress today"
  }
});
```

#### Using cURL:

```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "goalId": 1,
    "value": 25,
    "notes": "Made good progress today"
  }'
```

#### Expected Response:

```json
{
  "id": 1,
  "goalId": 1,
  "value": 25,
  "notes": "Made good progress today",
  "createdAt": "2025-03-10T05:20:34.696Z"
}
```

### Get Progress for a Goal

#### Using apiTester:

```typescript
const result = await testEndpoint({
  endpoint: ApiEndpoint.PROGRESS_LOGS_BY_GOAL.replace(':goalId', '1'),
  method: 'GET'
});
```

#### Using cURL:

```bash
curl -X GET http://localhost:3000/api/goals/1/progress
```

## Testing Action Items

### Get Action Items

#### Using apiTester:

```typescript
const result = await testEndpoint({
  endpoint: ApiEndpoint.ACTION_ITEMS,
  method: 'GET'
});
```

#### Using cURL:

```bash
curl -X GET http://localhost:3000/api/action-items
```

### Update an Action Item

#### Using apiTester:

```typescript
const result = await testEndpoint({
  endpoint: `${ApiEndpoint.ACTION_ITEMS}/1`,
  method: 'PATCH',
  data: {
    completed: true
  }
});
```

#### Using cURL:

```bash
curl -X PATCH http://localhost:3000/api/action-items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

## Common Validation Errors

### Invalid Date Format

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format in deadline",
    "details": [
      {
        "field": "deadline",
        "expected": "ISO8601 date string",
        "received": "2025-04-07",
        "constraint": "format: YYYY-MM-DDTHH:mm:ss.sssZ"
      }
    ]
  }
}
```

**Solution:** Always use ISO string format with `new Date().toISOString()` or explicit ISO format like `2025-04-07T00:00:00.000Z`.

### Invalid Category ID

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid category ID",
    "details": [
      {
        "field": "categoryId",
        "expected": "number",
        "received": "null",
        "constraint": "must be numeric"
      }
    ]
  }
}
```

**Solution:** Use `0` for no category, not `null`.

### Missing Required Fields

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required fields missing",
    "details": [
      {
        "field": "description",
        "expected": "string",
        "received": "undefined",
        "constraint": "required field"
      }
    ]
  }
}
```

**Solution:** Ensure all required fields are included in the request.

## Troubleshooting

### Testing the Full API

To run a comprehensive test of all API endpoints, use:

```typescript
const results = await testAllEndpoints();
console.log(results);
```

### Testing the Goal Lifecycle

To test the complete goal lifecycle (create, update, log progress, complete):

```typescript
const success = await testGoalLifecycle();
console.log(success ? "Goal lifecycle test passed" : "Goal lifecycle test failed");
```

### Debugging Network Issues

If you're experiencing connection issues:

1. Check that the server is running (`npm run dev`)
2. Verify the endpoint URL is correct
3. Check browser console for CORS errors
4. Use the Network tab in browser DevTools to inspect request/response

### Common Fixes for API Errors

1. **Date Formatting**: Always use `new Date().toISOString()` for date fields
2. **ID Fields**: Use numeric IDs (e.g., `0` for no category, not `null`)
3. **Missing UserID**: Include `userId: 1` in test requests if using external tools
4. **Invalid JSON**: Double-check that your JSON is properly formatted (no trailing commas)
5. **Query Parameters**: URL encode query parameters