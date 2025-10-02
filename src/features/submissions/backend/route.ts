import { type Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { submitReview } from './service';

export const registerSubmissionRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/submissions', async (c) => {
    const body = await c.req.json();
    const result = await submitReview(c, body);
    return respond(c, result);
  });
};

