import { type AppContext, getLogger, getSupabase } from '@/backend/hono/context';
import { getAuthenticatedUserId } from '@/backend/supabase/auth';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import {
  CreateAdvertiserSchema,
  CreateInfluencerSchema,
  CreateProfileSchema,
  type CreateAdvertiserInput,
  type CreateInfluencerInput,
  type CreateProfileInput,
  type OnboardingStatus,
} from './schema';

type ServiceErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_FAILED'
  | 'DUPLICATE_ROLE'
  | 'CONFLICT'
  | 'UNKNOWN';

export async function getOnboardingStatus(
  c: AppContext,
): Promise<HandlerResult<OnboardingStatus, ServiceErrorCode>> {
  const supabase = getSupabase(c);
  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) {
    return success({
      hasProfile: false,
      role: null,
      advertiserCompleted: null,
      influencerCompleted: null,
    });
  }

  if (profile.role === 'ADVERTISER') {
    const { data: adv } = await supabase
      .from('advertisers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    return success({
      hasProfile: true,
      role: 'ADVERTISER',
      advertiserCompleted: Boolean(adv?.id),
      influencerCompleted: null,
    });
  }

  const { data: inf } = await supabase
    .from('influencers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  return success({
    hasProfile: true,
    role: 'INFLUENCER',
    advertiserCompleted: null,
    influencerCompleted: Boolean(inf?.id),
  });
}

export async function createProfile(
  c: AppContext,
  input: CreateProfileInput,
): Promise<HandlerResult<{ ok: true }, ServiceErrorCode>> {
  const supabase = getSupabase(c);
  const logger = getLogger(c);

  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  }

  const parsed = CreateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return failure(400, 'VALIDATION_FAILED', '입력 값이 유효하지 않습니다.', parsed.error.flatten());
  }
  const { data: exists } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (exists) {
    return failure(409, 'CONFLICT', '프로필이 이미 존재합니다.');
  }

  const { error } = await supabase.from('profiles').insert({
    user_id: userId,
    role: parsed.data.role,
    name: parsed.data.name,
    dob: parsed.data.dob,
    phone: parsed.data.phone,
  });

  if (error) {
    logger.error(error);
    return failure(500, 'UNKNOWN', '프로필 생성 중 오류가 발생했습니다.');
  }

  return success({ ok: true }, 201);
}

export async function createAdvertiser(
  c: AppContext,
  input: CreateAdvertiserInput,
): Promise<HandlerResult<{ id: string }, ServiceErrorCode>> {
  const supabase = getSupabase(c);
  const logger = getLogger(c);
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (!profile || profile.role !== 'ADVERTISER') {
    return failure(409, 'DUPLICATE_ROLE', '광고주 역할이 아닙니다.');
  }

  const parsed = CreateAdvertiserSchema.safeParse(input);
  if (!parsed.success) {
    return failure(400, 'VALIDATION_FAILED', '입력 값이 유효하지 않습니다.', parsed.error.flatten());
  }

  const { data: exists } = await supabase
    .from('advertisers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (exists) {
    return failure(409, 'CONFLICT', '광고주 정보가 이미 존재합니다.');
  }

  const { data, error } = await supabase
    .from('advertisers')
    .insert({
      user_id: userId,
      company_name: parsed.data.companyName,
      business_number: parsed.data.businessNumber,
      representative: parsed.data.representative,
      store_phone: parsed.data.storePhone,
      address: parsed.data.address,
    })
    .select('id')
    .single();

  if (error) {
    logger.error(error);
    return failure(500, 'UNKNOWN', '광고주 정보 생성 중 오류가 발생했습니다.');
  }

  return success({ id: data.id }, 201);
}

export async function createInfluencer(
  c: AppContext,
  input: CreateInfluencerInput,
): Promise<HandlerResult<{ id: string }, ServiceErrorCode>> {
  const supabase = getSupabase(c);
  const logger = getLogger(c);
  const userId = await getAuthenticatedUserId(c);
  if (!userId) {
    return failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (!profile || profile.role !== 'INFLUENCER') {
    return failure(409, 'DUPLICATE_ROLE', '인플루언서 역할이 아닙니다.');
  }

  const parsed = CreateInfluencerSchema.safeParse(input);
  if (!parsed.success) {
    return failure(400, 'VALIDATION_FAILED', '입력 값이 유효하지 않습니다.', parsed.error.flatten());
  }

  const { data: exists } = await supabase
    .from('influencers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (exists) {
    return failure(409, 'CONFLICT', '인플루언서 정보가 이미 존재합니다.');
  }

  const { data: influencer, error: infErr } = await supabase
    .from('influencers')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (infErr || !influencer) {
    logger.error(infErr);
    return failure(500, 'UNKNOWN', '인플루언서 정보 생성 중 오류가 발생했습니다.');
  }

  const { error: chErr } = await supabase.from('influencer_channels').insert({
    influencer_id: influencer.id,
    platform: parsed.data.channelPlatform,
    name: parsed.data.channelName,
    url: parsed.data.channelUrl,
    followers: parsed.data.followers,
  });

  if (chErr) {
    logger.error(chErr);
    return failure(500, 'UNKNOWN', '채널 정보 생성 중 오류가 발생했습니다.');
  }

  return success({ id: influencer.id }, 201);
}
