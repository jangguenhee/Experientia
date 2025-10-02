import { type Hono } from 'hono';
import { respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';
import {
  CreateAdvertiserSchema,
  CreateInfluencerSchema,
  CreateProfileSchema,
} from './schema';
import {
  createAdvertiser,
  createInfluencer,
  createProfile,
  getOnboardingStatus,
} from './service';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/auth/onboarding/status', async (c) => {
    const result = await getOnboardingStatus(c);
    return respond(c, result);
  });

  app.post('/api/auth/onboarding/profile', async (c) => {
    const body = await c.req.json();
    const parsed = CreateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: 'VALIDATION_FAILED',
          message: '입력 값이 유효하지 않습니다.',
          details: parsed.error.flatten(),
        },
      });
    }
    const result = await createProfile(c, parsed.data);
    return respond(c, result);
  });

  app.post('/api/auth/onboarding/advertiser', async (c) => {
    const body = await c.req.json();
    const parsed = CreateAdvertiserSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: 'VALIDATION_FAILED',
          message: '입력 값이 유효하지 않습니다.',
          details: parsed.error.flatten(),
        },
      });
    }
    const result = await createAdvertiser(c, parsed.data);
    return respond(c, result);
  });

  app.post('/api/auth/onboarding/influencer', async (c) => {
    const body = await c.req.json();
    const parsed = CreateInfluencerSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: 'VALIDATION_FAILED',
          message: '입력 값이 유효하지 않습니다.',
          details: parsed.error.flatten(),
        },
      });
    }
    const result = await createInfluencer(c, parsed.data);
    return respond(c, result);
  });
};

