# Contributing to GOAL:SYNC

Thank you for your interest in contributing to GOAL:SYNC! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Structure](#code-structure)
- [API Development Guidelines](#api-development-guidelines)
- [Frontend Development Guidelines](#frontend-development-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Development Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. The application will run on `http://localhost:3000`

## Code Structure

The project is organized as follows:

```
goal-sync/
├── client/            # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions and services
│   │   ├── pages/       # Page components
│   │   ├── App.tsx      # Main application component
│   │   └── main.tsx     # Entry point
├── server/            # Backend Express application
│   ├── index.ts       # Server entry point
│   ├── routes.ts      # API routes
│   ├── storage.ts     # Data storage interface
│   ├── errorHandler.ts # Error handling utilities
│   └── vite.ts        # Vite server configuration
├── shared/            # Shared code between client and server
│   └── schema.ts      # Data schemas and types
└── package.json
```

## API Development Guidelines

### Error Handling

Always use the structured error format provided in `server/errorHandler.ts`:

```typescript
// For validation errors
if (error instanceof z.ZodError) {
  return res.status(400).json(formatZodError(error));
}

// For not found errors
return res.status(404).json(notFoundError("Resource"));

// For conflict errors
return res.status(409).json(conflictError("Resource already exists"));

// For internal server errors
return res.status(500).json(internalError("Error message"));
```

### Data Validation

Use Zod schemas from `shared/schema.ts` to validate request data:

```typescript
try {
  const data = schema.parse(req.body);
  // Process data
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json(formatZodError(error));
  }
  throw error;
}
```

### Route Structure

When adding new routes:

1. Group related routes together
2. Use comments to distinguish different sections
3. Apply middleware consistently (e.g., `requireAuth`)
4. Use proper HTTP status codes
5. Format responses consistently

Example:
```typescript
// ==== Resource Routes ====
app.get('/api/resources', requireAuth, async (req, res) => {
  try {
    // Implementation
    res.json(data);
  } catch (error) {
    // Error handling
  }
});
```

## Frontend Development Guidelines

### Using API Data

Always use React Query for data fetching:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/endpoint'],
  // Default fetcher is configured
});
```

For mutations:

```typescript
const mutation = useMutation({
  mutationFn: (data) => apiRequest('/api/endpoint', 'POST', data),
  onSuccess: () => {
    // Invalidate queries as needed
    queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
  }
});

// Use the mutation
mutation.mutate(formData);
```

### Forms

Use shadcn's form components with Zod validation:

```typescript
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: {
    // Default values
  }
});

const onSubmit = (data: z.infer<typeof schema>) => {
  // Submit data
};
```

### Error Handling

Parse API errors and display them to the user:

```typescript
try {
  // API request
} catch (error) {
  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    
    // Display error message
    toast({
      title: "Error",
      description: apiError.message,
      variant: "destructive"
    });
    
    // Handle field-specific errors
    if (apiError.details) {
      apiError.details.forEach(detail => {
        form.setError(detail.field, {
          message: detail.constraint || detail.message
        });
      });
    }
  }
}
```

## Testing

### API Testing

Use the `apiTester` utility for testing API endpoints:

```typescript
import { testEndpoint, ApiEndpoint } from '@/lib/apiTester';

const result = await testEndpoint({
  endpoint: ApiEndpoint.RESOURCE,
  method: 'POST',
  data: {
    // Test data
  }
});

// Check result
console.log(result.success, result.data);
```

### UI Testing

Use the `featureTester` utility for testing UI components:

```typescript
import { registerFeatureTest, TestStatus } from '@/lib/featureTester';

registerFeatureTest({
  id: 'feature-test-id',
  name: 'Feature Test Name',
  description: 'Test description',
  area: FeatureArea.UI,
  test: async () => {
    // Test logic
    return true; // or false if test fails
  }
});
```

## Pull Request Process

1. Create a new branch for your feature or bugfix
2. Make your changes and commit them
3. Write tests for your changes
4. Update documentation as needed
5. Submit a pull request
6. Address any review comments
7. Once approved, your changes will be merged

Thank you for contributing to GOAL:SYNC!