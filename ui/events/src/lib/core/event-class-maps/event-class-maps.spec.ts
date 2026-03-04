import {
  getStatusClass,
  getStreamHealthClass,
  EVENT_STATUS_CLASSES,
  STREAM_HEALTH_CLASSES,
} from './event-class-maps';

describe('event-class-maps', () => {
  describe('getStatusClass', () => {
    it('returns SCSS/BEM classes for known status', () => {
      expect(getStatusClass('upcoming')).toBe(EVENT_STATUS_CLASSES['upcoming']);
      expect(getStatusClass('live')).toBe(EVENT_STATUS_CLASSES['live']);
      expect(getStatusClass('completed')).toBe(EVENT_STATUS_CLASSES['completed']);
    });

    it('returns empty string for unknown status', () => {
      expect(getStatusClass('unknown')).toBe('');
      expect(getStatusClass('')).toBe('');
    });
  });

  describe('getStreamHealthClass', () => {
    it('returns SCSS/BEM classes for known health', () => {
      expect(getStreamHealthClass('excellent')).toBe(STREAM_HEALTH_CLASSES['excellent']);
      expect(getStreamHealthClass('good')).toBe(STREAM_HEALTH_CLASSES['good']);
      expect(getStreamHealthClass('fair')).toBe(STREAM_HEALTH_CLASSES['fair']);
      expect(getStreamHealthClass('poor')).toBe(STREAM_HEALTH_CLASSES['poor']);
    });

    it('returns empty string for undefined or empty', () => {
      expect(getStreamHealthClass(undefined)).toBe('');
      expect(getStreamHealthClass('')).toBe('');
    });

    it('returns empty string for unknown health', () => {
      expect(getStreamHealthClass('unknown')).toBe('');
    });
  });
});

