# API Standards Documentation

This document outlines the standards and conventions used in the GOAL:SYNC application's API, with a focus on the debug API endpoints.

## API Endpoint Structure

All API endpoints follow a consistent structure:

1. **Resource-based URL paths** - URLs are organized around resources
   - Examples: `/api/goals`, `/api/debug`, `/api/action-items`

2. **HTTP verbs** - Standard HTTP methods express actions
   - `GET` - Retrieve resources
   - `POST` - Create new resources or execute actions
   - `PUT` - Update resources (full replacement)
   - `PATCH` - Partial update of resources
   - `DELETE` - Remove resources

3. **Consistent response format** - All responses use a consistent JSON structure
   - Success responses include the requested data
   - Error responses follow a standardized error format

## Debug API Standards

The debug API follows additional standards for debugging and testing:

### Endpoint Naming

1. **List/Index endpoints** - `GET /api/debug`
   - Returns a list of available debug functions
   - Includes metadata and documentation links

2. **Function-specific endpoints** - `GET /api/debug/:functionName`
   - Addresses a specific debug function
   - Returns information about that function and its capabilities

3. **Action endpoints** - `POST /api/debug/query`
   - Used for operations that require parameters or have side effects
   - Accept JSON payloads with specific schemas

### Request Format

All requests to the debug API should follow these conventions:

1. **Content-Type header** - `application/json` for all requests with a body
2. **JSON request bodies** - Well-formed JSON for all POST/PUT/PATCH requests
3. **URL parameters** - Used for resource identification
4. **Query parameters** - Used for filtering, sorting, and pagination

Example query request:
```json
{
  "query": "getFeatureVerificationStatus()"
}
```

### Response Format

All responses from the debug API follow a consistent format:

#### Success Responses

```json
{
  "message": "Debug query processed",
  "query": {
    "text": "getFeatureVerificationStatus()",
    "type": "featureStatus",
    "processed": true
  },
  "result": {
    "status": "success",
    "timestamp": "2025-03-10T10:49:36.465Z",
    "data": { ... }
  }
}
```

#### Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query format",
    "details": [
      {
        "path": ["query"],
        "message": "String must contain at least 3 character(s)"
      }
    ]
  }
}
```

### Error Codes

The API uses the following error codes:

| Code              | HTTP Status | Description                                  |
|-------------------|-------------|----------------------------------------------|
| VALIDATION_ERROR  | 400         | Invalid input data                           |
| NOT_FOUND         | 404         | Resource or function not found               |
| UNAUTHORIZED      | 401         | Authentication required                      |
| FORBIDDEN         | 403         | Insufficient permissions                     |
| CONFLICT          | 409         | Resource already exists or state conflict    |
| INTERNAL_ERROR    | 500         | Server-side error                            |

## Testing with curl

The debug API can be tested using curl commands:

```bash
# Get a list of all available debug functions
curl -X GET http://localhost:5000/api/debug

# Execute a specific debug function
curl -X GET http://localhost:5000/api/debug/getFeatureVerificationStatus

# Execute a custom debug query
curl -X POST http://localhost:5000/api/debug/query \
  -H "Content-Type: application/json" \
  -d '{"query": "getFeatureVerificationStatus()"}'
```

## Security Considerations

The debug API implements several security measures:

1. **No Direct Execution**: Server-side API endpoints don't directly execute arbitrary code. Instead, they provide a structured interface for interacting with the debug infrastructure.

2. **Input Validation**: All inputs are validated using Zod schemas to prevent injection attacks.

3. **Limited Functionality**: Debug endpoints are designed with specific, limited functionality to reduce attack surface.

4. **Read-Only Operations**: Most debug endpoints are read-only to prevent unintended side effects.

## Integration with Frontend

The debug API is designed to integrate with the Debug Toolchain Inspector component, which provides:

1. **Visual Interface**: Graphical interface for executing debug queries
2. **Documentation**: Interactive documentation of available functions
3. **Request Builder**: Assistance in constructing valid API requests
4. **Response Viewer**: Formatted display of API responses

## Future API Enhancements

Planned enhancements to the debug API include:

1. **Authentication**: Adding token-based authentication for debug endpoints
2. **Rate Limiting**: Implementing rate limiting to prevent abuse
3. **Webhook Support**: Adding webhook capabilities for real-time notifications
4. **Query Caching**: Implementing caching for frequently used queries
5. **Batch Operations**: Supporting batch operations for multiple queries