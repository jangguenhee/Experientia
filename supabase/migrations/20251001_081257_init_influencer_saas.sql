-- =========================================================
-- Supabase Migration: Influencer SaaS (Schema + RLS Policies)
-- - ENUMS, TABLES, INDEXES
-- - RLS ENABLE + 최소권한 정책
-- =========================================================

-- 확장 (UUID 생성)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- 1) ENUMS
-- =========================
CREATE TYPE category AS ENUM ('FOOD','BEAUTY','TRAVEL','LIFE','CULTURE','DIGITAL');
CREATE TYPE region AS ENUM ('SEOUL','INCHEON','GYEONGGI','BUSAN');
CREATE TYPE campaign_status AS ENUM ('OPEN','CLOSED','SELECTED');
CREATE TYPE application_status AS ENUM ('APPLIED','SELECTED','REJECTED','WAITLISTED');
CREATE TYPE channel_platform AS ENUM ('NAVER_BLOG','INSTAGRAM','YOUTUBE','THREADS','OTHER');
CREATE TYPE user_role AS ENUM ('ADVERTISER','INFLUENCER');

-- =========================
-- 2) TABLES
-- =========================

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id    UUID PRIMARY KEY,
  role       user_role NOT NULL,
  name       TEXT NOT NULL,
  dob        DATE NOT NULL,
  phone      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.advertisers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID UNIQUE NOT NULL,
  company_name     TEXT NOT NULL,
  business_number  TEXT NOT NULL,
  representative   TEXT NOT NULL,
  store_phone      TEXT NOT NULL,
  address          TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_adv_profile FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.influencers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_inf_profile FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.influencer_channels (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id  UUID NOT NULL,
  platform       channel_platform,
  name           TEXT NOT NULL,
  url            TEXT NOT NULL,
  followers      INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_channel_influencer FOREIGN KEY (influencer_id) REFERENCES public.influencers(id) ON DELETE CASCADE,
  CONSTRAINT uq_channel_per_influencer UNIQUE (influencer_id, url)
);
CREATE INDEX IF NOT EXISTS idx_channel_influencer ON public.influencer_channels(influencer_id);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id       UUID NOT NULL,
  title               TEXT NOT NULL,
  category            category NOT NULL,
  region              region NOT NULL,
  benefit_desc        TEXT NOT NULL,
  store_info          TEXT NOT NULL,
  mission             TEXT NOT NULL,
  capacity            INTEGER NOT NULL CHECK (capacity > 0),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  selection_deadline  DATE,
  status              campaign_status NOT NULL DEFAULT 'OPEN',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_campaign_adv FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_campaign_discovery ON public.campaigns (status, category, region, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_adv ON public.campaigns (advertiser_id, status);

CREATE TABLE IF NOT EXISTS public.applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL,
  influencer_id  UUID NOT NULL,
  note           TEXT,
  visit_date     DATE,
  status         application_status NOT NULL DEFAULT 'APPLIED',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_app_campaign   FOREIGN KEY (campaign_id)   REFERENCES public.campaigns(id)   ON DELETE CASCADE,
  CONSTRAINT fk_app_influencer FOREIGN KEY (influencer_id) REFERENCES public.influencers(id) ON DELETE CASCADE,
  CONSTRAINT uq_app_once UNIQUE (campaign_id, influencer_id)
);
CREATE INDEX IF NOT EXISTS idx_app_influencer_status ON public.applications (influencer_id, status);
CREATE INDEX IF NOT EXISTS idx_app_campaign ON public.applications (campaign_id);

CREATE TABLE IF NOT EXISTS public.submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL,
  review_url     TEXT NOT NULL,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_submission_application FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_submission_application ON public.submissions(application_id);

-- =========================
-- 3) RLS ENABLE
-- =========================
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions         ENABLE ROW LEVEL SECURITY;

-- 필요 시 강화:
-- ALTER TABLE public.profiles            FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.advertisers         FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.influencers         FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.influencer_channels FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.campaigns           FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.applications        FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.submissions         FORCE ROW LEVEL SECURITY;

-- =========================
-- 4) POLICIES
-- =========================

-- profiles: 본인만 조회/수정
DROP POLICY IF EXISTS prof_select_self ON public.profiles;
CREATE POLICY prof_select_self
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS prof_update_self ON public.profiles;
CREATE POLICY prof_update_self
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- advertisers: 본인만 읽기/쓰기
DROP POLICY IF EXISTS adv_rw_self ON public.advertisers;
CREATE POLICY adv_rw_self
  ON public.advertisers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- influencers: 본인만 읽기/쓰기
DROP POLICY IF EXISTS inf_rw_self ON public.influencers;
CREATE POLICY inf_rw_self
  ON public.influencers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- influencer_channels: 소유 인플루언서만 읽기/쓰기
DROP POLICY IF EXISTS ch_rw_owner ON public.influencer_channels;
CREATE POLICY ch_rw_owner
  ON public.influencer_channels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers i
      WHERE i.id = influencer_id AND i.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.influencers i
      WHERE i.id = influencer_id AND i.user_id = auth.uid()
    )
  );

-- campaigns:
-- 공개 READ (탐색/상세)
DROP POLICY IF EXISTS camp_read_public ON public.campaigns;
CREATE POLICY camp_read_public
  ON public.campaigns
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 작성자(광고주)만 쓰기
DROP POLICY IF EXISTS camp_write_owner ON public.campaigns;
CREATE POLICY camp_write_owner
  ON public.campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.advertisers a
      WHERE a.id = campaigns.advertiser_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.advertisers a
      WHERE a.id = campaigns.advertiser_id
        AND a.user_id = auth.uid()
    )
  );

-- applications:
-- 읽기: 신청자 본인 OR 캠페인 소유 광고주
DROP POLICY IF EXISTS app_select_owner_or_adv ON public.applications;
CREATE POLICY app_select_owner_or_adv
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers i
      WHERE i.id = applications.influencer_id
        AND i.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.campaigns c
      JOIN public.advertisers a ON a.id = c.advertiser_id
      WHERE c.id = applications.campaign_id
        AND a.user_id = auth.uid()
    )
  );

-- 생성: 인플루언서 본인만
DROP POLICY IF EXISTS app_insert_influencer_self ON public.applications;
CREATE POLICY app_insert_influencer_self
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.influencers i
      WHERE i.id = applications.influencer_id
        AND i.user_id = auth.uid()
    )
  );

-- 수정(인플루언서): 본인 신청 + 상태 APPLIED
DROP POLICY IF EXISTS app_update_influencer_own_applied ON public.applications;
CREATE POLICY app_update_influencer_own_applied
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    status = 'APPLIED'
    AND EXISTS (
      SELECT 1 FROM public.influencers i
      WHERE i.id = applications.influencer_id
        AND i.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'APPLIED'
    AND EXISTS (
      SELECT 1 FROM public.influencers i
      WHERE i.id = applications.influencer_id
        AND i.user_id = auth.uid()
    )
  );

-- 수정(광고주): 캠페인 소유자 → 상태 변경 가능
DROP POLICY IF EXISTS app_update_advertiser_status ON public.applications;
CREATE POLICY app_update_advertiser_status
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaigns c
      JOIN public.advertisers a ON a.id = c.advertiser_id
      WHERE c.id = applications.campaign_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.campaigns c
      JOIN public.advertisers a ON a.id = c.advertiser_id
      WHERE c.id = applications.campaign_id
        AND a.user_id = auth.uid()
    )
  );

-- submissions:
-- 읽기: 인플루언서 본인 OR 캠페인 광고주
DROP POLICY IF EXISTS sub_select_owner_or_adv ON public.submissions;
CREATE POLICY sub_select_owner_or_adv
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications ap
      JOIN public.influencers i ON i.id = ap.influencer_id
      WHERE ap.id = submissions.application_id
        AND i.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.applications ap
      JOIN public.campaigns c ON c.id = ap.campaign_id
      JOIN public.advertisers a ON a.id = c.advertiser_id
      WHERE ap.id = submissions.application_id
        AND a.user_id = auth.uid()
    )
  );

-- 생성: 선정(SELECTED) 상태의 본인 신청 건만
DROP POLICY IF EXISTS sub_insert_influencer_selected ON public.submissions;
CREATE POLICY sub_insert_influencer_selected
  ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications ap
      JOIN public.influencers i ON i.id = ap.influencer_id
      WHERE ap.id = submissions.application_id
        AND ap.status = 'SELECTED'
        AND i.user_id = auth.uid()
    )
  );

-- (선택) 수정: 인플루언서 본인만 본인 제출 수정 허용
DROP POLICY IF EXISTS sub_update_influencer_own ON public.submissions;
CREATE POLICY sub_update_influencer_own
  ON public.submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications ap
      JOIN public.influencers i ON i.id = ap.influencer_id
      WHERE ap.id = submissions.application_id
        AND i.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications ap
      JOIN public.influencers i ON i.id = ap.influencer_id
      WHERE ap.id = submissions.application_id
        AND i.user_id = auth.uid()
    )
  );

-- 삭제 정책은 부여하지 않음(기본 거부)
-- =========================================================
-- 끝
-- =========================================================