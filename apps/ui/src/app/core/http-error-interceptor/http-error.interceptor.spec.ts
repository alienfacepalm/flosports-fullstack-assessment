import '@angular/compiler';
import { HttpErrorResponse } from '@angular/common/http';
import { mapErrorToUiMessage } from '../error-mapping/error-mapping';

describe('httpErrorInterceptor (error mapping contract)', () => {
  it('maps 500 responses to retryable UI errors', () => {
    const err = new HttpErrorResponse({ status: 500 });
    const ui = mapErrorToUiMessage(err);
    expect(ui.retryable).toBe(true);
  });
});


