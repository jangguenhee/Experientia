import { getSupabase, type AppContext } from '@/backend/hono/context';
import { getAuthenticatedUserId } from '@/backend/supabase/auth';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { format } from 'date-fns';
import { match } from 'ts-pattern';
import {
  CampaignDetailSchema,
  CampaignFeedResponseSchema,
  CampaignListQuerySchema,
  CreateCampaignSchema,
  SelectInfluencersSchema,
  type CampaignDetail,
  type CampaignFeedResponse,
  type CampaignListQuery,
  type CreateCampaignInput,
  type SelectInfluencersInput,
} from './schema';
import type { CampaignServiceError } from './error';

const formatDate = (value: string | Date) =>
  format(new Date(value), 'yyyy-MM-dd');

export async function getCampaigns(
  c: AppContext,
  rawQuery: unknown,
): Promise<HandlerResult<CampaignFeedResponse, CampaignServiceError>> {
  const supabase = getSupabase(c);
  const parsed = CampaignListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return failure(400, 'VALIDATION_FAILED', '쿼리 파라미터가 유효하지 않습니다.', parsed.error.flatten());
  }
  const query = parsed.data as CampaignListQuery;

  let builder = supabase
    .from('campaigns')
    .select('id,title,category,region,end_date,capacity,status,applications:applications(count)')
    .eq('status', query.status);

  if (query.category) builder = builder.eq('category', query.category);
  if (query.region) builder = builder.eq('region', query.region);
  if (query.cursor) builder = builder.gt('id', query.cursor);

  builder = match(query.sort)
    .with('latest', () => builder.order('created_at', { ascending: false }))
    .with('popular', () =>
      builder
        .order('applications.count', { ascending: false })
        .order('created_at', { ascending: false }),
    )
    .exhaustive();

  builder = builder.limit(query.limit);

  const { data, error } = await builder;
  if (error) {
    return failure(500, 'FETCH_FAILED', '캠페인 조회 중 오류가 발생했습니다.');
  }

  const items = (data ?? []).map((row: any) => {
    const applicationCount = Number(row.applications?.[0]?.count ?? 0);
    return {
      id: row.id as string,
      title: row.title as string,
      category: row.category as any,
      region: row.region as any,
      endDate: formatDate(row.end_date),
      capacity: Number(row.capacity),
      applicationCount,
      coverImageUrl: `https://picsum.photos/seed/${row.id}/600/400`,
      status: row.status as any,
    };
  });

  const nextCursor = items.length === query.limit ? items[items.length - 1]?.id ?? null : null;
  const result = CampaignFeedResponseSchema.parse({ items, nextCursor, hasMore: Boolean(nextCursor) });
  return success(result);
}

export async function getCampaignDetail(
  c: AppContext,
  id: string,
): Promise<HandlerResult<CampaignDetail, CampaignServiceError>> {
  const supabase = getSupabase(c);
  const { data, error } = await supabase
    .from('campaigns')
    .select('id,title,category,region,benefit_desc,store_info,mission,capacity,start_date,end_date,selection_deadline,status,applications:applications(count)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return failure(500, 'FETCH_FAILED', '캠페인 상세 조회 중 오류가 발생했습니다.');
  }
  if (!data) {
    return failure(404, 'NOT_FOUND', '캠페인을 찾을 수 없습니다.');
  }

  const applicationCount = Number(data.applications?.[0]?.count ?? 0);
  const detail = CampaignDetailSchema.parse({
    id: data.id,
    title: data.title,
    category: data.category,
    region: data.region,
    benefitDesc: data.benefit_desc,
    storeInfo: data.store_info,
    mission: data.mission,
    capacity: Number(data.capacity),
    startDate: formatDate(data.start_date),
    endDate: formatDate(data.end_date),
    selectionDeadline: data.selection_deadline ? formatDate(data.selection_deadline) : null,
    status: data.status,
    applicationCount,
    coverImageUrl: `https://picsum.photos/seed/${data.id}/1200/800`,
  });

  return success(detail);
}

export async function createCampaign(
  c: AppContext,
  rawBody: unknown,
): Promise<HandlerResult<{ id: string }, CampaignServiceError>> {
  const supabase = getSupabase(c);
  const parsed = CreateCampaignSchema.safeParse(rawBody);
  if (!parsed.success) {
    return failure(400, 'VALIDATION_FAILED', '입력 값이 유효하지 않습니다.', parsed.error.flatten());
  }
  const body = parsed.data as CreateCampaignInput;

  // 현재 사용자로부터 advertiser 레코드 찾기
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return failure(401, 'FETCH_FAILED', '로그인이 필요합니다.');
  }
  const { data: advertiser, error: advErr } = await supabase
    .from('advertisers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (advErr) {
    return failure(500, 'FETCH_FAILED', '광고주 정보 조회 중 오류가 발생했습니다.');
  }
  if (!advertiser) {
    return failure(403, 'FETCH_FAILED', '광고주만 캠페인을 생성할 수 있습니다.');
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      advertiser_id: advertiser.id,
      title: body.title,
      category: body.category,
      region: body.region,
      benefit_desc: body.benefitDesc,
      store_info: body.storeInfo,
      mission: body.mission,
      capacity: body.capacity,
      start_date: body.startDate,
      end_date: body.endDate,
      selection_deadline: body.selectionDeadline ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    return failure(500, 'FETCH_FAILED', '캠페인 생성 중 오류가 발생했습니다.');
  }

  return success({ id: data.id }, 201);
}

export async function closeCampaign(
  c: AppContext,
  id: string,
): Promise<HandlerResult<{ id: string; status: 'CLOSED' }, CampaignServiceError>> {
  const supabase = getSupabase(c);
  const userId = await getAuthenticatedUserId(c);
  if (!userId) return failure(401, 'FETCH_FAILED', '로그인이 필요합니다.');

  // 광고주 소유 캠페인인지 확인
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id,status,advertiser_id')
    .eq('id', id)
    .maybeSingle();
  if (!campaign) return failure(404, 'NOT_FOUND', '캠페인을 찾을 수 없습니다.');

  const { data: advertiser } = await supabase
    .from('advertisers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!advertiser || advertiser.id !== campaign.advertiser_id) {
    return failure(403, 'FETCH_FAILED', '권한이 없습니다.');
  }

  const { data: updated, error } = await supabase
    .from('campaigns')
    .update({ status: 'CLOSED' })
    .eq('id', id)
    .select('id,status')
    .single();
  if (error || !updated) return failure(500, 'FETCH_FAILED', '모집 종료 중 오류가 발생했습니다.');

  return success({ id: updated.id as string, status: 'CLOSED' }, 200);
}

export async function selectInfluencers(
  c: AppContext,
  id: string,
  rawBody: unknown,
): Promise<HandlerResult<{ updated: number }, CampaignServiceError>> {
  const supabase = getSupabase(c);
  const userId = await getAuthenticatedUserId(c);
  if (!userId) return failure(401, 'FETCH_FAILED', '로그인이 필요합니다.');

  // 광고주 소유 확인
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id,advertiser_id,selection_deadline')
    .eq('id', id)
    .maybeSingle();
  if (!campaign) return failure(404, 'NOT_FOUND', '캠페인을 찾을 수 없습니다.');
  const { data: advertiser } = await supabase
    .from('advertisers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!advertiser || advertiser.id !== campaign.advertiser_id) {
    return failure(403, 'FETCH_FAILED', '권한이 없습니다.');
  }

  const parsed = SelectInfluencersSchema.safeParse(rawBody);
  if (!parsed.success) {
    return failure(400, 'VALIDATION_FAILED', '입력 값이 유효하지 않습니다.', parsed.error.flatten());
  }
  const body = parsed.data as SelectInfluencersInput;

  // 선정 마감 기한 검증(설정된 경우 현재가 마감 전인지)
  if (campaign.selection_deadline) {
    const today = new Date();
    const deadline = new Date(campaign.selection_deadline as string);
    if (today > deadline) {
      return failure(403, 'FETCH_FAILED', '선정 마감 기한을 초과했습니다.');
    }
  }

  // 트랜잭션 대용: 순차 업데이트 (Supabase RPC 미사용)
  let updated = 0;
  if (body.selectedApplicationIds.length > 0) {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'SELECTED' })
      .in('id', body.selectedApplicationIds);
    if (error) return failure(500, 'FETCH_FAILED', '선정 업데이트 중 오류가 발생했습니다.');
    updated += body.selectedApplicationIds.length;
  }
  if (body.waitlistApplicationIds.length > 0) {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'WAITLISTED' })
      .in('id', body.waitlistApplicationIds);
    if (error) return failure(500, 'FETCH_FAILED', '대기자 업데이트 중 오류가 발생했습니다.');
    updated += body.waitlistApplicationIds.length;
  }

  return success({ updated }, 200);
}

