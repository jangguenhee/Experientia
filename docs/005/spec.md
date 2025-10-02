# 005 — 모집 종료 & 선정 (광고주) Use Case

## Primary Actor
- 광고주(자신이 생성한 캠페인의 관리자)

## Precondition (사용자 관점)
- 광고주로 회원가입 및 온보딩을 완료했다.
- 최소 1개 이상의 캠페인을 생성했다.
- 캠페인이 OPEN 상태이거나 CLOSED 상태에서 선정 가능 기한 내에 있다.

## Trigger
- 광고주가 대시보드에서 특정 캠페인 상세 페이지에 진입하여 모집 종료/선정을 진행한다.

## Main Scenario
1. 광고주가 캠페인 상세 페이지에 진입한다.
2. 광고주가 모집 종료 버튼을 클릭한다(조기 종료 포함).
3. 시스템이 캠페인 상태를 CLOSED로 전환한다.
4. 광고주가 지원자 리스트를 확인한다.
5. 광고주가 선정할 인플루언서를 선택한다.
6. 필요 시 대기자 인원도 선택한다.
7. 광고주가 선정 완료 버튼을 클릭한다.
8. 시스템이 선택된 인플루언서를 SELECTED 상태로, 대기자를 WAITLISTED 상태로 업데이트한다.
9. 시스템이 알림(이메일)을 발송한다.
10. 시스템이 선정 결과를 UI에 반영한다.

## Edge Cases
- 모집 정원보다 적게 지원한 경우 → 정원 미달 상태로 선정 가능
- 선정 마감 기한 초과 → 선정 불가, 안내 메시지 표시
- 네트워크/서버 오류 → 상태 업데이트 실패 시 재시도 유도
- 광고주 권한이 없는 캠페인 접근 → 차단

## Business Rules
- 모집 종료는 광고주만 할 수 있다.
- 모집 종료 후 선정은 선정 마감 기한 내에서만 가능하다.
- 선정된 인플루언서 수는 정원(capacity)을 초과할 수 없다.
- 대기자는 소수만 지정할 수 있다(예: 최대 10명).
- 선정 완료 후 결과는 변경할 수 없다(추후 수정 정책은 별도 정의).

## Sequence Diagram (PlantUML)

```plantuml
@startuml
actor Advertiser as User
participant FE
participant BE
database Database

User -> FE: 캠페인 상세 페이지 진입
FE -> BE: 캠페인 상세 요청(campaign_id)
BE -> Database: SELECT * FROM campaigns WHERE id=?
Database --> BE: 캠페인 정보 반환
BE --> FE: 상세 응답
FE -> User: 캠페인 상세 표시

User -> FE: 모집 종료 버튼 클릭
FE -> BE: 모집 종료 요청(campaign_id)
BE -> Database: UPDATE campaigns SET status='CLOSED' WHERE id=?
Database --> BE: OK
BE --> FE: 상태 변경 완료 응답
FE -> User: 모집 종료 반영

User -> FE: 지원자 리스트 확인
FE -> BE: 지원자 리스트 요청(campaign_id)
BE -> Database: SELECT * FROM applications WHERE campaign_id=?
Database --> BE: 지원자 목록 반환
BE --> FE: 응답
FE -> User: 지원자 리스트 표시

User -> FE: 인플루언서/대기자 선택 후 선정 완료 버튼 클릭
FE -> BE: 선정 요청(application_ids, waitlist_ids)
BE -> Database: UPDATE applications SET status='SELECTED' WHERE id IN (...)
BE -> Database: UPDATE applications SET status='WAITLISTED' WHERE id IN (...)
Database --> BE: OK
BE --> FE: 선정 완료 응답
FE -> User: 결과 반영 및 알림 표시

BE -> External Email Service: 선정/대기자 알림 발송
@enduml
```
