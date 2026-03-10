# students Feature Plan

## Executive Summary

| | |
|---|---|
| **Feature** | students (수강생 관리) |
| **Start Date** | 2026-03-10 |
| **Phase** | Plan |

### Value Delivered

| Perspective | Detail |
|---|---|
| **Problem** | 뜨개 공방 원장이 수강생별 수강권 잔여 횟수/기간을 수기로 관리해 실수와 누락이 잦다 |
| **Solution** | 수강생 프로필 + 수강권(횟수제/기간제) CRUD, 출석 체크 시 자동 차감, 수강료 POS 결제를 통합 제공 |
| **Function UX Effect** | 수강생 목록에서 한 눈에 잔여 횟수 확인, 원클릭 출석 체크, 수강권 만료 경고로 선제적 갱신 유도 |
| **Core Value** | 수강 관련 모든 업무를 단일 화면에서 처리해 원장의 관리 부담을 제거하고 실수를 방지한다 |

---

## 1. Feature Overview

### 1.1 Goal

수강생 프로필, 수강권(횟수제/기간제), 출석 이력을 통합 관리하고 POS와 연동해 수강료 결제까지 원스톱으로 처리한다.

### 1.2 Scope

**In Scope**
- 수강생 CRUD (이름, 연락처, 메모)
- 수강권 등록·조회 (횟수제/기간제)
- 출석 체크 → `process_attendance` RPC 호출로 자동 차감
- 수강생 상세: 출석 이력 + 수강권 이력
- POS 화면에서 수강권 구매/연장 결제 (class_fee 판매)

**Out of Scope**
- 알림 문자 발송
- 수업 시간표/스케줄 관리
- 다중 강사 관리

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-07 | 수강생 프로필 CRUD (이름, 연락처, 메모) | Must |
| FR-08 | 수강권 등록 (횟수제: 총 횟수/잔여, 기간제: 시작일/종료일) + 상태 자동 계산 | Must |
| FR-09 | 출석 체크 시 process_attendance RPC 호출, 잔여 횟수 자동 차감 | Must |
| FR-09b | 수강생 상세 페이지: 출석 이력, 현재 수강권 정보 | Must |
| FR-11 | POS에서 수강권 구매 결제 (type='class_fee') | Should |
| FR-11b | 수강권 만료/소진 경고 배지 표시 | Should |

### 2.2 Non-Functional Requirements

- 출석 체크는 RPC 트랜잭션으로 원자적 처리 (직접 DML 금지)
- 수강권 상태(active/expired/exhausted)는 DB 기준값 사용, 클라이언트 재계산 없음
- 목록 로딩 시 수강생당 현재 활성 수강권 1건 join해 잔여 정보 표시

---

## 3. Technical Design Summary

### 3.1 Data Model (기존 DB 활용)

```
students         subscriptions          attendances
---------        -------------          -----------
id               id                     id
shop_id          student_id (FK)        student_id (FK)
name             type (count|period)    subscription_id (FK)
phone            total_count            attended_at
memo             remaining              memo
created_at       starts_at
updated_at       expires_at
                 price
                 status (active|expired|exhausted)
                 created_at
```

**DB Functions (SECURITY DEFINER)**
- `process_attendance(p_student_id, p_subscription_id, p_memo?)` → attendance_id

### 3.2 Directory Structure

```
src/features/students/
├── components/
│   ├── StudentCard.tsx          # 목록 카드 (이름, 연락처, 잔여 횟수)
│   ├── StudentForm.tsx          # 등록/수정 Sheet
│   ├── SubscriptionForm.tsx     # 수강권 등록 Sheet
│   ├── AttendanceButton.tsx     # 출석 체크 버튼 + 확인 Dialog
│   └── AttendanceHistory.tsx    # 출석 이력 목록
├── hooks/
│   ├── useStudents.ts           # 수강생 목록 + 상세 쿼리
│   ├── useSubscriptions.ts      # 수강권 조회/등록
│   └── useAttendance.ts         # 출석 체크 mutation
└── types.ts                     # StudentWithSub 등 확장 타입

src/app/(dashboard)/students/
├── page.tsx                     # 수강생 목록
└── [studentId]/
    └── page.tsx                 # 수강생 상세
```

### 3.3 Key Queries

- `useStudents()`: `students` + 최신 active `subscriptions` 1건 LEFT JOIN
- `useStudent(id)`: 수강생 + 전체 subscriptions + attendances
- `useAttend()`: `process_attendance` RPC mutation → invalidate students, subscriptions

---

## 4. Implementation Plan

### Phase 1: 수강생 CRUD (FR-07)
- [x] `useStudents`, `useStudent` hooks
- [x] `StudentForm` (Sheet: 이름·연락처·메모, react-hook-form + zod)
- [x] `StudentCard` 컴포넌트
- [x] `students/page.tsx` 목록 + 검색

### Phase 2: 수강권 관리 (FR-08)
- [x] `useSubscriptions`, `useCreateSubscription` hooks
- [x] `SubscriptionForm` (Sheet: 횟수제/기간제 분기 입력)
- [x] 수강생 상세 페이지 `[studentId]/page.tsx`
- [x] 상태 배지 (active/expired/exhausted)

### Phase 3: 출석 체크 (FR-09)
- [x] `useAttend` mutation (process_attendance RPC)
- [x] `AttendanceButton` + 확인 Dialog
- [x] `AttendanceHistory` 출석 이력
- [x] 잔여 횟수 실시간 반영

### Phase 4: POS 연동 (FR-11)
- [x] POS에 수강권 구매 항목 추가 (학생 선택 + 수강권 타입 선택)
- [x] checkout 시 type='class_fee' sale 생성 + subscription 등록

---

## 5. Acceptance Criteria

| # | 기준 |
|---|------|
| 1 | 수강생 등록 후 목록에 즉시 표시 |
| 2 | 횟수제 수강권 등록 시 잔여 횟수 = total_count |
| 3 | 출석 체크 후 잔여 횟수 1 감소, 0이면 exhausted |
| 4 | 기간제 수강권 만료일 초과 시 expired 배지 |
| 5 | 출석 이력 목록에 날짜·수강권 유형 표시 |
| 6 | POS에서 수강권 결제 시 subscription 레코드 생성 |

---

## 6. Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| process_attendance RPC 미배포 | supabase/migrations 확인 후 없으면 직접 migration 파일 작성 |
| 수강권 복수 active 상태 | 등록 시 기존 active 수강권 경고 표시 (중복 허용, UI 안내만) |
| POS 수강권 결제 복잡도 증가 | FR-11은 Phase 4로 분리, Phase 1~3 완료 후 진행 |
