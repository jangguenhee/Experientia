# Campaign Discovery Planning (Clean)

본 문서는 UI 와이어링 작업 이후의 관리/선정/리뷰 흐름 정리를 위한 계획서입니다. 실행 코드는 모두 실제 소스 경로에 배치되며, 여기서는 참고용 스니펫만 코드 펜스로 제공합니다.

## 생성 → 관리 페이지 이동 흐름
- 생성 성공 시 React Query 캐시 무효화 후 `router.replace(/dashboard/campaigns/{id}/manage)`
- 관리 페이지는 `refetchOnMount: "always"`, `staleTime: 0`로 이동 직후 최신화

```tsx
// 참고 스니펫만: 실제 구현은 src/app/(protected)/dashboard/campaigns/new/page.tsx에 존재
```

## 상태 변경 후 갱신
- 모집 종료/선정 확정 시 상세/리스트 캐시 무효화 + `router.refresh()`

```tsx
// 참고 스니펫만: 실제 구현은 src/app/(protected)/dashboard/campaigns/[campaignId]/manage/page.tsx에 존재
```
