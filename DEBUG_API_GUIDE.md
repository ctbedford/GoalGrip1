# Goal:Sync Debug API Guide

This guide explains how to use the debug infrastructure that has been implemented for the Goal:Sync application. The debug infrastructure provides routes, utilities, and tools to help monitor, test, and document the application's features and performance.

## Table of Contents

1. [Debug API Endpoints](#debug-api-endpoints)
2. [CLI Debug Tool](#cli-debug-tool)
3. [Documentation Generation](#documentation-generation)
4. [Feature Status Tracking](#feature-status-tracking)
5. [Integration with AI Agents](#integration-with-ai-agents)

## Debug API Endpoints

The following API endpoints are available for debugging purposes:

### Core Debug API

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/debug` | GET | Overview of available debug endpoints |
| `/api/debug/features` | GET | List all features and their implementation status |
| `/api/debug/features/:name` | GET | Get detailed info about a specific feature |
| `/api/debug/tests` | GET | List all tests and their status |
| `/api/debug/tests/run/:id` | POST | Run a specific test |
| `/api/debug/tests/run-all` | POST | Run all tests |
| `/api/debug/logs` | GET | Get application logs with optional filters |
| `/api/debug/performance` | GET | Get performance metrics |
| `/api/debug/markdown` | GET | List available markdown documentation files |
| `/api/debug/markdown/:filename` | GET | Get content of a specific markdown file |

### Example API Requests

#### Get Feature Information

```bash
curl http://localhost:5000/api/debug/features/goal-creation
```

Response:
```json
{
  "name": "goal-creation",
  "status": {
    "implemented": true,
    "tested": false,
    "lastVerified": "2025-03-10T00:00:00.000Z",
    "notes": ["Implemented basic functionality", "Still needs form validation"]
  },
  "relatedTests": [
    {
      "id": "test-goal-creation",
      "name": "Goal Creation Test",
      "description": "Test creating a new goal",
      "status": "not_started"
    }
  ],
  "recentLogs": [],
  "recommendations": [
    "Add tests for the goal-creation feature"
  ],
  "timestamp": "2025-03-11T00:00:00.000Z"
}
```

#### Get Application Logs

```bash
curl http://localhost:5000/api/debug/logs?level=error&limit=10
```

Response:
```json
{
  "logs": [
    {
      "level": 3,
      "area": "api",
      "message": "Failed to fetch goals",
      "timestamp": "2025-03-10T23:15:00.000Z",
      "data": {
        "error": "Database connection error"
      }
    }
  ],
  "count": 1,
  "totalAvailable": 156,
  "filters": {
    "level": 3
  },
  "timestamp": "2025-03-11T00:00:00.000Z"
}
```

## CLI Debug Tool

A command-line interface (CLI) tool is provided for quick access to debug functionality. The tool is available at `server/debug-cli.ts` and can be run using:

```bash
npx tsx server/debug-cli.ts <command> [options]
```

Available commands:

| Command | Description | Example |
| ------- | ----------- | ------- |
| `help` | Show help information | `npx tsx server/debug-cli.ts help` |
| `feature <feature-name>` | Get information about a specific feature | `npx tsx server/debug-cli.ts feature goal-creation` |
| `test <test-id>` | Run a specific test | `npx tsx server/debug-cli.ts test dashboard-metrics` |
| `test-all` | Run all tests | `npx tsx server/debug-cli.ts test-all` |
| `report [--type=<type>]` | Generate a report | `npx tsx server/debug-cli.ts report --type=development` |
| `docs [--update]` | List or update documentation | `npx tsx server/debug-cli.ts docs --update` |
| `logs [--level=<level>] [--area=<area>] [--limit=<number>]` | Show application logs | `npx tsx server/debug-cli.ts logs --level=error --limit=10` |

## Documentation Generation

The debug infrastructure includes utilities for generating and updating markdown documentation for features. The generated documentation helps track feature implementation status, test results, and performance metrics.

### Feature Documentation

Create or update feature documentation using the `updateFeatureDocumentation` function in `server/utils/debug-utils.ts`:

```typescript
import { updateFeatureDocumentation } from './utils/debug-utils';

updateFeatureDocumentation({
  name: 'Goal Creation',
  description: 'Allows users to create new goals with details like title, target, deadline, and category.',
  status: 'implemented',
  area: FeatureArea.GOAL,
  dependencies: ['Category Management'],
  apis: ['/api/goals (POST)'],
  components: ['CreateGoalModal', 'GoalForm'],
  notes: ['Implemented basic functionality', 'Still needs form validation'],
  lastUpdated: new Date()
});
```

### Report Generation

Generate development progress reports, test result reports, and performance reports using the CLI or directly from the API:

```bash
# Generate a development progress report
npx tsx server/debug-cli.ts report --type=development

# Generate a test results report
npx tsx server/debug-cli.ts report --type=test

# Generate a performance report
npx tsx server/debug-cli.ts report --type=performance
```

## Feature Status Tracking

The debug infrastructure provides tools for tracking the implementation and testing status of features. Status tracking helps monitor progress and identify areas that need attention.

### Feature Status API

Get the status of all features:

```bash
curl http://localhost:5000/api/debug/features
```

Get the status of a specific feature:

```bash
curl http://localhost:5000/api/debug/features/goal-creation
```

### Status Visualization

The development progress report (`DEVELOPMENT_PROGRESS.md`) includes visualizations of feature status:

```
[####===***+++...] 45% Complete

Legend: # = Complete, = = Tested, * = Implemented, + = In Progress, . = Planned
```

## Integration with AI Agents

The debug infrastructure is designed to work seamlessly with AI agents (like the Replit AI agent). AI agents can use the debug API endpoints to gather information about the application's features, tests, and performance.

### Example AI Agent Interactions

AI agents can use curl commands to access the debug API:

```bash
# Get information about a specific feature
curl http://localhost:5000/api/debug/features/goal-creation

# Run tests
curl -X POST http://localhost:5000/api/debug/tests/run-all

# Get performance metrics
curl http://localhost:5000/api/debug/performance
```

### Markdown Content Access

AI agents can access markdown documentation files for additional context:

```bash
# List available markdown files
curl http://localhost:5000/api/debug/markdown

# Get content of a specific markdown file
curl http://localhost:5000/api/debug/markdown/DEVELOPMENT_PROGRESS.md
```

The markdown content can be used to provide detailed information about the project's architecture, implementation, and progress.

## Customizing the Debug Infrastructure

The debug infrastructure can be extended and customized as needed. Key files include:

- `server/routes/simplified-debug-api.ts`: API endpoints for debugging
- `server/utils/debug-utils.ts`: Utilities for documentation generation
- `server/debug-cli.ts`: Command-line interface for debugging
- `DEBUG_API_GUIDE.md`: This guide