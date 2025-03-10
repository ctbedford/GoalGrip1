# GOAL:SYNC API Standards

This document outlines the standards and conventions used in the GOAL:SYNC API, including error formats, data validation requirements, and common patterns.

## Table of Contents
- [Error Handling](#error-handling)
- [Authentication](#authentication)
- [Data Validation](#data-validation)
- [Common Request Examples](#common-request-examples)
- [Testing Guide](#testing-guide)

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [
      {
        "field": "fieldName",
        "expected": "expectedType",
        "received": "receivedValue",
        "constraint": "constraintDescription"
      }
    ],
    "documentationUrl": "/docs/api-errors#error-code"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request data failed validation |
| `NOT_FOUND` | 404 | Requested resource doesn't exist |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | 500 | Server error |

## Authentication

For the current MVP, authentication is simulated. All requests use a default `userId` of 1.

In future releases, the API will use proper authentication with JWT tokens. Endpoints that require authentication will be protected with the `requireAuth` middleware.

## Data Validation

The API uses Zod for data validation. Here are the common validation requirements:

### User

- `username`: String, minimum 3 characters, unique
- `name`: String

### Goal

- `description`: String, required
- `targetValue`: Number, required
- `unit`: String, required
- `deadline`: ISO8601 date string (YYYY-MM-DDTHH:mm:ss.sssZ), required
- `categoryId`: Number, required (0 for no category)
- `reminderFrequency`: String, one of ["daily", "weekly", "monthly"]
- `userId`: Number, required

### Progress Log

- `goalId`: Number, required
- `value`: Number, required
- `notes`: String, optional

### Action Item

- `completed`: Boolean, required for updates

## Common Request Examples

### Creating a Goal

```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Run 5km every week",
    "targetValue": 5,
    "unit": "kilometers",
    "deadline": "2025-04-07T00:00:00.000Z",
    "categoryId": 0,
    "reminderFrequency": "weekly"
  }'
```

### Logging Progress

```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "goalId": 1,
    "value": 2.5,
    "notes": "Ran at the park"
  }'
```

### Updating an Action Item

```bash
curl -X PATCH http://localhost:3000/api/action-items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

## Testing Guide

### Testing Tools

GOAL:SYNC includes built-in testing utilities:

1. **apiTester**: Located in `client/src/lib/apiTester.ts`, provides methods to test API endpoints
2. **featureTester**: Located in `client/src/lib/featureTester.tsx`, offers UI component testing

### API Testing Flow

To test an API endpoint:

```typescript
import { testEndpoint, ApiEndpoint } from '@/lib/apiTester';

// Test goal creation
const result = await testEndpoint({
  endpoint: ApiEndpoint.GOALS,
  method: 'POST',
  data: {
    description: "Complete project documentation",
    targetValue: 100,
    unit: "percent",
    deadline: new Date().toISOString(), // Proper ISO format
    categoryId: 0, // Use 0 for no category, not null
    reminderFrequency: "weekly",
    userId: 1 // Always include userId
  }
});

// Check result
console.log(result.success, result.data);
```

### Common Testing Pitfalls

- Ensure dates are in ISO8601 format (use `new Date().toISOString()`)
- Always use numeric IDs (e.g., `categoryId: 0` instead of `categoryId: null`)
- Include `userId` in requests that require it
- Check validation errors in the response details array for specific field issues

### Automated Test Suite

Run the full test suite from the debug page:

1. Navigate to `/debug`
2. Click "Run API Tests"
3. Review the test results and fix any failures