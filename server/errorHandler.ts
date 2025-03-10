import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { fromZodError } from 'zod-validation-error';

/**
 * Error codes for API responses
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Structured API error response format
 */
export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: Array<{
      field?: string;
      expected?: string;
      received?: string;
      constraint?: string;
    }>;
    documentationUrl?: string;
  };
}

/**
 * Format Zod validation errors into a structured API error response
 */
export function formatZodError(error: z.ZodError): ApiError {
  const validationError = fromZodError(error);
  
  // Extract detailed field information from the Zod error
  const details = error.errors.map(err => {
    const field = err.path.join('.');
    let expected = '';
    let received = '';
    let constraint = '';

    // Type-safe handling of different Zod error types
    switch (err.code) {
      case 'invalid_type': {
        const typeErr = err as z.ZodIssueBase & { expected: string; received: unknown };
        expected = typeErr.expected;
        
        // Safely handle the received value
        if (typeErr.received === undefined) {
          received = 'undefined';
        } else if (typeErr.received === null) {
          received = 'null';
        } else if (typeof typeErr.received === 'string') {
          received = typeErr.received;
        } else {
          try {
            received = JSON.stringify(typeErr.received);
          } catch {
            received = 'invalid value';
          }
        }
        break;
      }
      case 'invalid_string':
      case 'invalid_date':
        expected = err.message.includes('format') 
          ? err.message.split('format').pop()?.trim() || 'valid format'
          : 'valid value';
        received = 'Invalid value';
        break;
      case 'too_small':
        constraint = 'minimum value not met';
        break;
      case 'too_big':
        constraint = 'maximum value exceeded';
        break;
      default:
        constraint = err.message;
        break;
    }

    return {
      field,
      expected,
      received,
      constraint,
    };
  });

  return {
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: validationError.message,
      details,
      documentationUrl: '/docs/api-validation',
    }
  };
}

/**
 * Create a not found error response
 */
export function notFoundError(resource: string): ApiError {
  return {
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `${resource} not found`,
      documentationUrl: '/docs/api-errors#not-found',
    }
  };
}

/**
 * Create a conflict error response (e.g., duplicate resource)
 */
export function conflictError(message: string): ApiError {
  return {
    error: {
      code: ErrorCode.CONFLICT,
      message,
      documentationUrl: '/docs/api-errors#conflict',
    }
  };
}

/**
 * Create a generic internal server error response
 */
export function internalError(message = 'An unexpected error occurred'): ApiError {
  return {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message,
      documentationUrl: '/docs/api-errors#internal-error',
    }
  };
}

/**
 * Global error handling middleware
 */
export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('API Error:', err);
  
  if (err instanceof z.ZodError) {
    return res.status(400).json(formatZodError(err));
  }
  
  // Default internal server error
  return res.status(500).json(internalError());
}