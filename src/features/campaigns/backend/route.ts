import { type Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { CampaignListQuerySchema } from './schema';
import { createCampaign, getCampaignDetail, getCampaigns, closeCampaign, selectInfluencers } from './service';

export const registerCampaignRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/campaigns', async (c) => {
    const query = c.req.query() as Record<string, string | undefined>;
    const parsed = CampaignListQuerySchema.safeParse({
      ...query,
      limit: query.limit,
      cursor: query.cursor ?? null,
    });
    if (!parsed.success) {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: 'VALIDATION_FAILED',
          message: '쿼리 파라미터가 유효하지 않습니다.',
          details: parsed.error.flatten(),
        },
      });
    }

    const result = await getCampaigns(c, parsed.data);
    return respond(c, result);
  });

  app.get('/api/campaigns/:id', async (c) => {
    const id = c.req.param('id');
    const result = await getCampaignDetail(c, id);
    return respond(c, result);
  });

  app.post('/api/campaigns', async (c) => {
    const body = await c.req.json();
    const result = await createCampaign(c, body);
    return respond(c, result);
  });

  app.post('/api/campaigns/:id/close', async (c) => {
    const id = c.req.param('id');
    const result = await closeCampaign(c, id);
    return respond(c, result);
  });

  app.post('/api/campaigns/:id/select', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await selectInfluencers(c, id, body);
    return respond(c, result);
  });
};

