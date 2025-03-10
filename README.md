# GOAL:SYNC - Goal Tracking Application

GOAL:SYNC is a comprehensive goal tracking application designed to help users set, track, and visualize progress toward personal goals. The application features a sophisticated dark Blade Runner-inspired aesthetic while maintaining robust functionality.

## Features

- **Goal Setting & Tracking**: Create measurable goals with deadlines and track progress
- **Dashboard**: View active goals, achievements, and upcoming action items
- **Analytics**: Visualize goal progress and identify trends
- **Achievements**: Earn badges and rewards for completing goals
- **User Profile**: Customize settings and preferences

## Development Status

- **Batch 1**: ✅ Enhanced dashboard with cyberpunk styling
- **Batch 2**: ✅ Analytics, Achievements, and Settings pages
- **Testing Infrastructure**: ✅ Debug utilities and testing framework
- **Batch 3**: 🔄 In progress

## Debug Environment

The application includes a comprehensive debugging environment to help with development and testing. Access it by navigating to the `/debug` route.

### Features of the Debug Console

1. **Feature Tests**: Test individual features to verify functionality
2. **API Tests**: Test API endpoints to ensure backend connectivity
3. **Debug Console**: View application logs and monitor system activity
4. **Documentation Viewer**: Access formatted technical documentation directly in the app

### Using the Debug Console

**Feature Tests**
- Click "Run All Tests" to test all implemented features
- Or click "Run" next to an individual test to check a specific feature
- Tests with dependencies will be skipped if dependent tests fail

**API Tests**
- Click "Run API Tests" to test all critical API endpoints
- Results will show HTTP status codes and success/failure indicators

**Log Console**
- View real-time logs with filtering by level (DEBUG, INFO, WARN, ERROR)
- Includes timestamp, module, and detailed error information when available

**Documentation Viewer**
- Access technical documentation with cyberpunk-styled formatting
- Select from available markdown files in the dropdown
- Use the refresh button to reload documentation files after changes
- Documentation includes implementation analysis, feature testing guidelines, and debug infrastructure details

## Technical Implementation 

GOAL:SYNC is built with:

- **Frontend**: React with TypeScript, Vite, Tailwind CSS, Shadcn UI components
- **Backend**: Express.js REST API
- **Storage**: In-memory storage (MemStorage) with PostgreSQL migration capability
- **State Management**: React Query for server state, React context for UI state
- **Testing**: Custom testing utilities for feature verification and API testing

## Documentation

The project includes comprehensive documentation to help developers:

- **[API Standards](API_STANDARDS.md)**: Guidelines for API interaction, error formats, and validation requirements
- **[API Testing Guide](API_TESTING.md)**: Detailed examples for testing API endpoints
- **[Contributing Guide](CONTRIBUTING.md)**: Instructions for setting up the development environment and contributing to the project
- **[Feature Testing](FEATURE_TESTING.md)**: Guide to using the feature testing infrastructure
- **[Debug Infrastructure](DEBUG_INFRASTRUCTURE.md)**: Details on debugging utilities

## Testing Infrastructure

The application includes built-in testing utilities:

- **apiTester**: Tests API endpoints and generates reports
- **featureTester**: Verifies UI features and functionalities
- **logger**: Monitors application activity and feature verification
- **Error Reporting**: Structured error format with field-specific validation details

These utilities help ensure robust application functionality and streamline the development process.

## Error Handling

GOAL:SYNC implements a sophisticated error handling system that provides:

- Structured error responses with consistent format
- Field-specific validation details
- Constraint information and expected vs. received values
- Documentation links for resolving common issues
- Proper HTTP status codes based on error type

Example error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { 
        "field": "deadline", 
        "expected": "ISO8601 date string", 
        "received": "2025-04-07", 
        "constraint": "format: YYYY-MM-DDTHH:mm:ss.sssZ" 
      }
    ],
    "documentationUrl": "/docs/api-validation"
  }
}
```