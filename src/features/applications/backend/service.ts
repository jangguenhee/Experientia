import { failure, success, type HandlerResult } from '@/backend/http/response';
import { getSupabase, type AppContext } from '@/backend/hono/context';
import { getAuthenticatedUserId } from '@/backend/supabase/auth';
import { CreateApplicationSchema, type CreateApplicationInput, CreatedApplicationSchema } from './schema';

type ApplyError = 'UNAUTHORIZED' | 'VALIDATION_FAILED' | 'FORBIDDEN' | 'CONFLICT' | 'NOT_FOUND' | 'UNKNOWN';

export async function createApplication(
  c: AppContext,
  rawBody: unknown,
): Promise<HandlerResult<{ id: string }, ApplyError>> {
  const supabase = getSupabase(c);
  const userId = await getAuthenticatedUserId(c);
  if (!userId) return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');

  const parsed = CreateApplicationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return failure(400, 'VALIDATION_FAILED', '입력 값이 유효하지 않습니다.', parsed.error.flatten());
  }
  const body = parsed.data as CreateApplicationInput;

  // 인플루언서 사용자 확인
  const { data: influencer } = await supabase
    .from('influencers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!influencer) return failure(403, 'FORBIDDEN', '인플루언서만 지원할 수 있습니다.');

  // 캠페인 유효성과 기간/상태 체크 (OPEN, visitDate in [start_date, end_date])
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id,status,start_date,end_date')
    .eq('id', body.campaignId)
    .maybeSingle();
  if (!campaign) return failure(404, 'NOT_FOUND', '캠페인을 찾을 수 없습니다.');
  if (campaign.status !== 'OPEN') return failure(403, 'FORBIDDEN', '모집이 종료된 캠페인입니다.');

  const visit = new Date(body.visitDate);
  const start = new Date(campaign.start_date as string);
  const end = new Date(campaign.end_date as string);
  if (!(visit >= start && visit <= end)) {
    return failure(400, 'VALIDATION_FAILED', '방문 예정일이 모집기간을 벗어났습니다.');
  }

  // 중복 지원 방지
  const { data: exists } = await supabase
    .from('applications')
    .select('id')
    .eq('campaign_id', body.campaignId)
    .eq('influencer_id', influencer.id)
    .maybeSingle();
  if (exists) return failure(409, 'CONFLICT', '이미 지원한 캠페인입니다.');

  const { data, error } = await supabase
    .from('applications')
    .insert({
      campaign_id: body.campaignId,
      influencer_id: influencer.id,
      note: body.note ?? null,
      visit_date: body.visitDate,
      status: 'APPLIED',
    })
    .select('id')
    .single();

  if (error || !data) return failure(500, 'UNKNOWN', '지원 생성 중 오류가 발생했습니다.');

  return success({ id: data.id as string }, 201);
}

