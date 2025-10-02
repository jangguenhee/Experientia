import { failure, success, type HandlerResult } from '@/backend/http/response';
import { getSupabase, type AppContext } from '@/backend/hono/context';
import { getAuthenticatedUserId } from '@/backend/supabase/auth';
import { SubmitReviewSchema, type SubmitReviewInput, SubmittedReviewSchema } from './schema';

type SubmitError = 'UNAUTHORIZED' | 'VALIDATION_FAILED' | 'FORBIDDEN' | 'CONFLICT' | 'NOT_FOUND' | 'UNKNOWN';

export async function submitReview(
  c: AppContext,
  rawBody: unknown,
): Promise<HandlerResult<{ id: string }, SubmitError>> {
  const supabase = getSupabase(c);
  const userId = await getAuthenticatedUserId(c);
  if (!userId) return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');

  const parsed = SubmitReviewSchema.safeParse(rawBody);
  if (!parsed.success) {
    return failure(400, 'VALIDATION_FAILED', '입력 값이 유효하지 않습니다.', parsed.error.flatten());
  }
  const body = parsed.data as SubmitReviewInput;

  // 본인(application → influencer_id → profiles.user_id) 여부 및 선정 상태 확인
  const { data: application } = await supabase
    .from('applications')
    .select('id,status,influencer_id,campaign_id')
    .eq('id', body.applicationId)
    .maybeSingle();
  if (!application) return failure(404, 'NOT_FOUND', '지원 내역을 찾을 수 없습니다.');
  if (application.status !== 'SELECTED') return failure(403, 'FORBIDDEN', '선정된 상태에서만 제출할 수 있습니다.');

  const { data: influencer } = await supabase
    .from('influencers')
    .select('id,user_id')
    .eq('id', application.influencer_id)
    .maybeSingle();
  if (!influencer || influencer.user_id !== userId) return failure(403, 'FORBIDDEN', '권한이 없습니다.');

  // 중복 제출 방지
  const { data: exists } = await supabase
    .from('submissions')
    .select('id')
    .eq('application_id', body.applicationId)
    .maybeSingle();
  if (exists) return failure(409, 'CONFLICT', '이미 리뷰를 제출했습니다.');

  const { data, error } = await supabase
    .from('submissions')
    .insert({ application_id: body.applicationId, review_url: body.reviewUrl })
    .select('id')
    .single();

  if (error || !data) return failure(500, 'UNKNOWN', '리뷰 제출 중 오류가 발생했습니다.');

  return success({ id: data.id as string }, 201);
}

