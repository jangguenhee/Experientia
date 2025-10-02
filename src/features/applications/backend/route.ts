import { type Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { createApplication } from './service';

export const registerApplicationRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/applications', async (c) => {
    const body = await c.req.json();
    const result = await createApplication(c, body);
    return respond(c, result);
  });
};

