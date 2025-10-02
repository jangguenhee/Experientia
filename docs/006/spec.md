# 006 — 리뷰 제출 (인플루언서) Use Case

## Primary Actor
- 인플루언서(선정된 사용자)

## Precondition (사용자 관점)
- 인플루언서로 회원가입 및 온보딩을 완료했다.
- 캠페인에 지원 후 선정되었다.
- 로그인 상태다.

## Trigger
- 인플루언서가 내 지원 목록 또는 캠페인 상세에서 리뷰 제출 버튼을 클릭한다.

## Main Scenario
1. 인플루언서가 내 지원 목록에 진입한다.
2. 선정된 캠페인 항목에서 리뷰 제출 버튼을 클릭한다.
3. 시스템이 리뷰 URL 입력 양식을 표시한다.
4. 인플루언서가 리뷰 URL을 입력하고 제출한다.
5. 시스템이 URL 형식을 검증한다.
6. 시스템이 인플루언서가 선정 상태인지 확인한다.
7. 시스템이 `submissions` 테이블에 레코드를 생성한다.
8. 시스템이 제출 완료 상태를 UI에 반영한다.
9. 시스템이 광고주에게 알림을 발송한다.

## Edge Cases
- URL 형식 오류 → 검증 실패, 재입력 요청
- 이미 제출된 상태에서 중복 제출 → 차단
- 선정되지 않은 인플루언서의 제출 시도 → 거부
- 네트워크/서버 오류 → 재시도 가능 상태 유지

## Business Rules
- 리뷰 제출은 선정된 인플루언서만 가능하다.
- 리뷰 URL은 필수이며 올바른 형식이어야 한다.
- 1개의 선정된 지원(application)당 1개의 리뷰 제출만 허용된다.

## Sequence Diagram (PlantUML)

```plantuml
@startuml
actor Influencer as User
participant FE
participant BE
database Database

User -> FE: 내 지원 목록 진입
FE -> BE: 지원 목록 요청(user_id)
BE -> Database: SELECT * FROM applications WHERE influencer_id=?
Database --> BE: 지원 목록 반환
BE --> FE: 응답
FE -> User: 내 지원 목록 표시

User -> FE: 리뷰 제출 버튼 클릭
FE -> User: 리뷰 URL 입력 요청

User -> FE: 리뷰 URL 제출
FE -> BE: 리뷰 제출 요청(application_id, review_url)

BE -> Database: SELECT applications WHERE id=?
Database --> BE: 지원 상태 반환

alt 상태=SELECTED
  BE -> Database: INSERT INTO submissions(application_id, review_url)
  Database --> BE: OK
  BE --> FE: 제출 성공 응답
  FE -> User: 리뷰 제출 완료 표시
  BE -> External Email Service: 광고주 알림 발송
else 상태!=SELECTED
  BE --> FE: 제출 불가 에러
  FE -> User: 리뷰 제출 차단 메시지
end
@enduml
```
