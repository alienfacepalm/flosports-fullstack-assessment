import { HttpErrorResponse } from '@angular/common/http';

export interface IUiErrorMessage {
  message: string;
  retryable: boolean;
}

/**
 * Maps HTTP and other errors to a clean, typed message for the UI.
 * Does not expose internal details or stack traces.
 */
export function mapErrorToUiMessage(error: unknown): IUiErrorMessage {
  if (error instanceof HttpErrorResponse) {
    const status = error.status;
    if (status >= 500 || status === 0) {
      return { message: 'Server is temporarily unavailable. Please try again.', retryable: true };
    }
    if (status === 404) {
      return { message: 'The requested resource was not found.', retryable: false };
    }
    if (status === 403) {
      return { message: 'You do not have permission to perform this action.', retryable: false };
    }
    if (status === 401) {
      return { message: 'Please sign in to continue.', retryable: false };
    }
    if (status >= 400 && status < 500) {
      const body = error.error;
      const detail = typeof body === 'object' && body != null && typeof body.message === 'string'
        ? body.message
        : undefined;
      return {
        message: detail ?? 'Your request could not be completed. Please check your input.',
        retryable: false,
      };
    }
    return { message: 'Something went wrong. Please try again.', retryable: true };
  }

  if (error instanceof Error) {
    return { message: 'Something went wrong. Please try again.', retryable: true };
  }

  return { message: 'An unexpected error occurred.', retryable: true };
}

