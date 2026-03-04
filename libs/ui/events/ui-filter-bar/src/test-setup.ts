import '@angular/compiler';
import { vi } from 'vitest';

vi.mock('@angular/core', async () => {
  const actual = await import('@angular/core');
  return {
    ...actual,
    // Stub viewChild so that components using the signal-based
    // viewChild API can be instantiated outside of an Angular
    // injection context for these unit tests.
    viewChild: <T>() => () => null as unknown as T,
  };
});

