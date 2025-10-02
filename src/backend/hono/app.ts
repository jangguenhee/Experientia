import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerCampaignRoutes } from '@/features/campaigns/backend/route';
import { registerAuthRoutes } from '@/features/auth/backend/route';
import { registerApplicationRoutes } from '@/features/applications/backend/route';
import { registerSubmissionRoutes } from '@/features/submissions/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerCampaignRoutes(app);
  registerAuthRoutes(app);
  registerApplicationRoutes(app);
  registerSubmissionRoutes(app);

  singletonApp = app;

  return app;
};
