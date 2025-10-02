# 002 — 캠페인 탐색 & 필터링 모듈 설계

## 개요
- 모듈: `src/features/campaigns/backend/schema.ts` — 캠페인 검색 쿼리/응답/테이블 스키마 Zod 정의 및 공통 타입 수출.
- 모듈: `src/features/campaigns/backend/error.ts` — 캠페인 피드/상세 조회 오류 코드 상수와 타입 선언.
- 모듈: `src/features/campaigns/backend/service.ts` — Supabase 질의 빌더, 인기순 정렬 로직, DTO 매핑, picsum 플레이스홀더 적용.
- 모듈: `src/features/campaigns/backend/route.ts` — `GET /campaigns`, `GET /campaigns/:id` 라우터 및 파라미터/쿼리 검증, 오류 응답 통일.
- 모듈: `src/features/campaigns/lib/dto.ts` — 프런트엔드 재사용을 위한 Zod 스키마/타입 재노출.
- 모듈: `src/features/campaigns/constants/filters.ts` — 카테고리/지역/정렬 옵션 및 copy, `ts-pattern` 매핑 유틸.
- 모듈: `src/features/campaigns/store/filter-store.ts` — `zustand` 기반 필터 상태 저장소와 `react-use` 디바운스 훅 래퍼.
- 모듈: `src/features/campaigns/hooks/useCampaignListQuery.ts` — `@tanstack/react-query` `useInfiniteQuery` 기반 목록 API 래퍼.
- 모듈: `src/features/campaigns/hooks/useCampaignDetailQuery.ts` — 상세 조회용 React Query 훅과 에러 메시지 노출.
- 모듈: `src/features/campaigns/components/campaign-filter-bar.tsx` — Shadcn UI를 활용한 필터 UI 컴포넌트.
- 모듈: `src/features/campaigns/components/campaign-card.tsx` — 카드 레이아웃, 인기 지표/상태 배지, picsum 플레이스홀더 처리.
- 모듈: `src/features/campaigns/components/campaign-discovery-view.tsx` — 필터 바, 카드 그리드, 무한 스크롤/로딩/빈 상태 orchestration.
- 모듈: `src/features/campaigns/components/campaign-detail-view.tsx` — 상세 정보 렌더링 및 오류/로딩 상태 처리.
- 페이지: `src/app/(protected)/campaigns/page.tsx` — Promise 기반 params 시그니처를 유지한 캠페인 탐색 페이지 엔트리.
- 페이지: `src/app/(protected)/campaigns/[campaignId]/page.tsx` — 상세 페이지 라우트, params Promise 처리 및 상세 뷰 연결.
- 테스트: `src/features/campaigns/backend/service.test.ts` — 정렬/매핑 로직에 대한 `vitest` 단위 테스트.
- 설정: `vitest.config.mts`, `package.json` 테스트 스크립트 — 백엔드 비즈니스 로직 테스트 환경 구성.

## Diagram
```mermaid
flowchart TD
  subgraph FE[프런트엔드]
    P[(app/(protected)/campaigns/page.tsx)]
    V[CampaignDiscoveryView]
    FB[CampaignFilterBar]
    CC[CampaignCard]
    HD[(app/(protected)/campaigns/[id]/page.tsx)]
  end
  subgraph Hooks[React Query + Store]
    H1[useCampaignListQuery]
    H2[useCampaignDetailQuery]
    ST[useCampaignFilterStore]
  end
  subgraph API[API Client]
    C[apiClient (axios)]
  end
  subgraph BE[Hono 라우터]
    R1[GET /campaigns]
    R2[GET /campaigns/:id]
    S[CampaignService]
  end
  subgraph DB[Supabase]
    T[(campaigns)]
    A[(applications)]
  end

  P --> V
  V --> FB
  V --> H1
  FB --> ST
  ST --> H1
  H1 --> C
  C --> R1
  R1 --> S
  S --> T
  S --> A
  V --> CC
  CC --> HD
  HD --> H2
  H2 --> C --> R2 --> S
```

## Implementation Plan

### 공통 준비
- `vitest`와 `@vitest/coverage-v8`, `@testing-library/dom`(필요 시) 설치 후 `package.json`에 `test` 스크립트 추가, `vitest.config.mts` 생성(ESM + tsconfig paths 지원).
- `tsconfig.json` `compilerOptions.types`에 `vitest/importMeta` 추가하여 타입 오류 방지.

### Backend Layer

#### `src/features/campaigns/backend/schema.ts`
- 쿼리 스키마: `status` 기본값 OPEN, `category`/`region`은 enum, `sort`는 `latest | popular`, `limit`는 12 기본, `cursor`는 nullable UUID.
- 응답 스키마: `items` 배열(카드 표시 필드, applicationCount, popularityScore 포함), `nextCursor`, `hasMore`.
- 상세 스키마: `CampaignDetailResponse`로 상세 설명/기간/미션 필드 포함.
- `ts-pattern`에서 활용할 정렬 상수 `CampaignSort` union export.

#### `src/features/campaigns/backend/error.ts`
- 에러 코드 상수: `FETCH_FAILED`, `NOT_FOUND`, `VALIDATION_FAILED` 등 정의.
- `type CampaignServiceError = typeof campaignErrorCodes[keyof ...]` 형태로 노출.

#### `src/features/campaigns/backend/service.ts`
- Supabase 질의: `from('campaigns')`에 `select`로 필요한 컬럼 + `applications(count)` 집계.
- 필터 적용: `eq`/`in` 조건, `cursor` 사용 시 `gt` 비교로 keyset 페이지네이션.
- 인기순: `ts-pattern`으로 정렬 분기, 인기순 시 `order('applications.count', { nullsLast: true, ascending: false })`, 후보 없으면 최신순 재조회.
- DTO 매핑: `date-fns` `format`으로 날짜 포맷, `es-toolkit` `clamp`로 지원율 계산, `picsum.photos/seed/{id}` 플레이스홀더 적용.
- 반환: `success`/`failure` 사용, `hasMore` 계산.

#### `src/features/campaigns/backend/route.ts`
- `app.get('/campaigns', ...)` 구현: `schema.parse`로 쿼리 검증, 실패 시 400 응답.
- `app.get('/campaigns/:id', ...)` 구현: params 검증 후 서비스 호출.
- 에러 코드 매핑: 로거에 실패 기록, 응답 래핑.

#### `src/backend/hono/app.ts`
- `registerCampaignRoutes` import 및 실행 추가(기존 example 아래에 체이닝).

#### `src/features/campaigns/backend/service.test.ts`
- `vitest`로 service 내 순수 함수 분리(`mapCampaignRow`, `computePopularitySort`) 후 테스트.
  - 시나리오 1: 인기순 정렬 시 지원율 200% 이상 캠페인이 상위에 위치.
  - 시나리오 2: 인기순 결과 없을 때 최신순 결과로 fallback.
  - 시나리오 3: 아바타 없는 경우 picsum URL 생성.
  - 시나리오 4: cursor 페이지네이션이 올바르게 nextCursor 계산.
- Supabase 클라이언트는 테스트 도중 모킹(람다 기반 stub) 처리.

### Shared / Lib

#### `src/features/campaigns/lib/dto.ts`
- 백엔드 스키마 재노출(`CampaignFeedResponse`, `CampaignDetailResponse`, `CampaignSort`).

#### `src/features/campaigns/constants/filters.ts`
- 카테고리/지역 레이블 맵, 정렬 옵션 배열, `ts-pattern`으로 API 쿼리 파라미터 맵핑(미지정 시 기본값 latest).
- UI copy 포함(예: "전체", "서울·수도권").

#### `src/features/campaigns/store/filter-store.ts`
- `zustand`로 필터 상태(`category`, `region`, `sort`)와 setter 및 reset 제공.
- `react-use` `useDebounce` 로 래핑된 `useDebouncedFilters` 커스텀 훅 정의(필터 연속 클릭 디바운스).

### Frontend Layer

#### `src/features/campaigns/hooks/useCampaignListQuery.ts`
- `useInfiniteQuery` 구현: `queryKey`는 필터 조합, `getNextPageParam`으로 `nextCursor` 사용.
- API 호출은 `apiClient.get('/api/campaigns', { params })`, 응답은 `CampaignFeedResponseSchema.parse`.
- 로더/에러 메시지 추출은 `extractApiErrorMessage` 활용.

#### `src/features/campaigns/hooks/useCampaignDetailQuery.ts`
- `useQuery` 구현: `CampaignDetailResponseSchema.parse`, `enabled`는 `Boolean(campaignId)`.

#### `src/features/campaigns/components/campaign-filter-bar.tsx`
- Shadcn `Select`, `DropdownMenu`, `Button` 구성으로 필터 UI 작성.
- `useCampaignFilterStore` 연결, `lucide-react` 아이콘으로 시각 피드백.
- QA Sheet:
  | ID | 시나리오 | 조작 | 기대 결과 |
  | --- | --- | --- | --- |
  | QA-F-01 | 기본 진입 | 페이지 로드 | 정렬 드롭다운 `최신순` 기본 선택 |
  | QA-F-02 | 카테고리 선택 | `뷰티` 선택 | 필터 store 상태가 `BEAUTY`로 업데이트되고 목록 재조회 |
  | QA-F-03 | 빠른 필터 연속 클릭 | 카테고리 `뷰티`→`푸드` 200ms 내 연속 선택 | 디바운스 적용되어 마지막 선택(`푸드`)만 API 호출 |
  | QA-F-04 | 필터 초기화 | "필터 초기화" 클릭 | 모든 필터 기본값 복원, 목록 리셋 |

#### `src/features/campaigns/components/campaign-card.tsx`
- 카드 레이아웃: `Card` 컴포넌트 활용, 상태 배지(`OPEN`, 모집률), `picsum` 플레이스홀더 이미지.
- 클릭 시 Next `Link`로 상세 경로 이동.
- QA Sheet:
  | ID | 시나리오 | 조작 | 기대 결과 |
  | --- | --- | --- | --- |
  | QA-C-01 | 기본 데이터 | 모집률 150% 캠페인 렌더 | 모집률 배지가 `150%`로 빨간색 강조, 인기 라벨 노출 |
  | QA-C-02 | 이미지 없음 | `coverImageUrl` 없음 | `https://picsum.photos/seed/{id}/600/400` 이미지를 사용 |
  | QA-C-03 | 상태 닫힘 | status=CLOSED | 카드 상단에 `모집 종료` 배지, hover 시 클릭 비활성 |

#### `src/features/campaigns/components/campaign-discovery-view.tsx`
- 필터 바, 무한 스크롤 목록, 빈 상태(`EmptyState`), 에러 상태, 로딩 스켈레톤 구성.
- IntersectionObserver(`react-use` `useIntersection`)로 자동 다음 페이지 로드, 버튼 fallback.
- QA Sheet:
  | ID | 시나리오 | 조작 | 기대 결과 |
  | --- | --- | --- | --- |
  | QA-V-01 | 기본 로딩 | 페이지 진입 | 상단 필터 + 로딩 스켈레톤 12개 노출 |
  | QA-V-02 | 빈 결과 | 존재하지 않는 필터 조합 | "조건에 맞는 캠페인이 없습니다" 문구 및 재설정 CTA |
  | QA-V-03 | 무한 스크롤 | 스크롤 하단 도달 | 다음 페이지 자동 로드 및 중복 없는 카드 추가 |
  | QA-V-04 | 서버 오류 | API 500 강제 | 토스트/에러 블록에 `extractApiErrorMessage` 메시지 표시 |

#### `src/features/campaigns/components/campaign-detail-view.tsx`
- 상세 정보: 캠페인 소개, 혜택, 일정, 미션 섹션 렌더.
- 로딩/에러 UI 포함, 모집 종료 시 안내 문구.
- QA Sheet:
  | ID | 시나리오 | 조작 | 기대 결과 |
  | --- | --- | --- | --- |
  | QA-D-01 | 정상 조회 | 카드 클릭 후 이동 | 상세 데이터 섹션 모두 채워짐 |
  | QA-D-02 | 존재하지 않는 ID | `/campaigns/{잘못된ID}` 접근 | 404 안내 및 뒤로가기 버튼 |
  | QA-D-03 | 로딩 중 | 느린 네트워크 모의 | 스켈레톤 유지, 완료 후 본문 교체 |

#### `src/app/(protected)/campaigns/page.tsx`
- 클라이언트 컴포넌트 선언, `params: Promise<Record<string, never>>` 시그니처 유지.
- `CampaignDiscoveryView` 포함, 상단 히어로 섹션 및 배경 그라데이션.

#### `src/app/(protected)/campaigns/[campaignId]/page.tsx`
- `params: Promise<{ campaignId: string }>` 사용, `await` 후 `CampaignDetailView` 렌더.
- 잘못된 UUID 시 라우터에서 404 페이지 유도.

### QA & 검증
- 수동 QA: 위 QA 시트 항목 체크리스트화(노션 등) 후 시연.
- API 테스트: Thunder Client 혹은 REST Client로 `/api/campaigns`, `/api/campaigns/:id` 200/400/404 케이스 점검.
- 단위 테스트: `npm run test` 로 `vitest` 실행, CI 통합 전제.
