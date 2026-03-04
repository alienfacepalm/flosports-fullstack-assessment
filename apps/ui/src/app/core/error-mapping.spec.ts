import { HttpErrorResponse } from '@angular/common/http';
import { mapErrorToUiMessage } from './error-mapping';

describe('mapErrorToUiMessage', () => {
  it('returns retryable message for 500', () => {
    const err = new HttpErrorResponse({ status: 500 });
    const result = mapErrorToUiMessage(err);
    expect(result.message).toContain('temporarily unavailable');
    expect(result.retryable).toBe(true);
  });

  it('returns retryable message for 0 (network error)', () => {
    const err = new HttpErrorResponse({ status: 0 });
    const result = mapErrorToUiMessage(err);
    expect(result.retryable).toBe(true);
  });

  it('returns non-retryable message for 404', () => {
    const err = new HttpErrorResponse({ status: 404 });
    const result = mapErrorToUiMessage(err);
    expect(result.message).toContain('not found');
    expect(result.retryable).toBe(false);
  });

  it('returns message for 400 with optional body.message', () => {
    const err = new HttpErrorResponse({ status: 400, error: { message: 'Invalid filter' } });
    const result = mapErrorToUiMessage(err);
    expect(result.message).toBe('Invalid filter');
    expect(result.retryable).toBe(false);
  });

  it('returns generic message for generic Error', () => {
    const result = mapErrorToUiMessage(new Error('oops'));
    expect(result.message).toContain('Something went wrong');
    expect(result.retryable).toBe(true);
  });

  it('returns fallback for unknown value', () => {
    const result = mapErrorToUiMessage('string error');
    expect(result.message).toContain('unexpected');
    expect(result.retryable).toBe(true);
  });
});
