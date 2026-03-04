import axios, { AxiosError } from 'axios';

const BASE = '/api';

describe('Events API (e2e)', () => {
  describe('GET /events', () => {
    it('returns 200 and an array of events', async () => {
      const res = await axios.get(`${BASE}/events`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.events)).toBe(true);
    });

    it('filters by liveOnly=true (only live events)', async () => {
      const res = await axios.get(`${BASE}/events`, {
        params: { liveOnly: 'true' },
      });
      expect(res.status).toBe(200);
      const events = res.data.events as Array<{ status: string }>;
      if (events.length > 0) {
        expect(events.every((e) => e.status === 'live')).toBe(true);
      }
    });

    it('filters by sport (case-insensitive)', async () => {
      const res = await axios.get(`${BASE}/events`, {
        params: { sport: 'Cycling' },
      });
      expect(res.status).toBe(200);
      const events = res.data.events as Array<{ sport: string }>;
      if (events.length > 0) {
        expect(events.every((e) => e.sport.toLowerCase() === 'cycling')).toBe(true);
      }
    });

    it('filters by title search (substring)', async () => {
      const res = await axios.get(`${BASE}/events`, {
        params: { search: 'Track' },
      });
      expect(res.status).toBe(200);
      const events = res.data.events as Array<{ title: string }>;
      if (events.length > 0) {
        expect(events.every((e) => e.title.toLowerCase().includes('track'))).toBe(true);
      }
    });

    it('accepts combined filters', async () => {
      const res = await axios.get(`${BASE}/events`, {
        params: { liveOnly: 'true', sport: 'Wrestling' },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.events)).toBe(true);
    });
  });

  describe('GET /events/:id', () => {
    it('returns 200 and event when id exists', async () => {
      const listRes = await axios.get(`${BASE}/events`);
      const events = (listRes.data as { events: Array<{ id: string }> }).events;
      if (events.length === 0) return;
      const id = events[0].id;
      const res = await axios.get(`${BASE}/events/${id}`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('id', id);
      expect(res.data).toHaveProperty('title');
      expect(res.data).toHaveProperty('sport');
      expect(res.data).toHaveProperty('status');
    });

    it('returns 404 when id does not exist', async () => {
      try {
        await axios.get(`${BASE}/events/non-existent-id-12345`);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        expect(axiosError.response?.status).toBe(404);
        return;
      }
      throw new Error('Expected 404');
    });
  });

  describe('GET /sports', () => {
    it('returns 200 and array of sport names', async () => {
      const res = await axios.get(`${BASE}/sports`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      if (res.data.length > 0) {
        expect(res.data.every((s: unknown) => typeof s === 'string')).toBe(true);
      }
    });
  });

  describe('Rate limiting', () => {
    it('allows normal request volume', async () => {
      const requests = Array.from({ length: 5 }, () =>
        axios.get(`${BASE}/sports`)
      );
      const results = await Promise.all(requests);
      results.forEach((r) => expect(r.status).toBe(200));
    });
  });
});
