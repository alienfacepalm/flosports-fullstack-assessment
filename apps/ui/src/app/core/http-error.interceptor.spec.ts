import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { httpErrorInterceptor } from './http-error.interceptor';
import { mapErrorToUiMessage } from './error-mapping';

describe('httpErrorInterceptor', () => {
  let client: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('forwards successful response', (done) => {
    client.get('/api/events').subscribe({
      next: (body) => {
        expect(body).toEqual([]);
        done();
      },
    });
    const req = controller.expectOne('/api/events');
    req.flush([]);
  });

  it('maps error and rethrows so subscriber receives error', (done) => {
    client.get('/api/events').subscribe({
      error: (err) => {
        const ui = mapErrorToUiMessage(err);
        expect(ui.message).toBeDefined();
        expect(ui.retryable).toBeDefined();
        done();
      },
    });
    const req = controller.expectOne('/api/events');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });
});
