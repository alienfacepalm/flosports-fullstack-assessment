/**
 * Semantic SCSS class names for event status and stream health.
 * Used for consistency and testability; styles defined in app.scss.
 */
export const EVENT_STATUS_CLASSES: Readonly<Record<string, string>> = {
  upcoming: 'event-status event-status--upcoming',
  live: 'event-status event-status--live',
  completed: 'event-status event-status--completed',
} as const;

export const STREAM_HEALTH_CLASSES: Readonly<Record<string, string>> = {
  excellent: 'stream-health--excellent',
  good: 'stream-health--good',
  fair: 'stream-health--fair',
  poor: 'stream-health--poor',
} as const;

export function getStatusClass(status: string): string {
  return EVENT_STATUS_CLASSES[status] ?? '';
}

export function getStreamHealthClass(health: string | undefined): string {
  if (health == null || health === '') {
    return '';
  }
  return STREAM_HEALTH_CLASSES[health] ?? '';
}

