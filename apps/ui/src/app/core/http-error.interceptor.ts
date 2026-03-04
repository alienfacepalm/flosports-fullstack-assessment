import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, tap, throwError, timer } from 'rxjs';
import { mapErrorToUiMessage } from './error-mapping';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function isRetryable(status: number): boolean {
  return status >= 500 || status === 0;
}

/**
 * Global HTTP interceptor: logs requests, maps errors to UI messages, and optionally retries on 5xx.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): import('rxjs').Observable<HttpEvent<unknown>> => {
  const started = Date.now();

  return next(req).pipe(
    tap({
      next: () => {
        if (typeof ngDevMode !== 'undefined' && ngDevMode) {
          console.debug(`[HTTP] ${req.method} ${req.urlWithParams} ${Date.now() - started}ms`);
        }
      },
    }),
    retry({
      count: MAX_RETRIES,
      delay: (err, count) => {
        if (count > MAX_RETRIES) {
          return throwError(() => err);
        }
        if (err instanceof HttpErrorResponse && isRetryable(err.status)) {
          return timer(RETRY_DELAY_MS);
        }
        return throwError(() => err);
      },
    }),
    catchError((error: unknown) => {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const ui = mapErrorToUiMessage(error);
        console.warn('[HTTP] Error:', ui.message, error);
      }
      return throwError(() => error);
    })
  );
};
