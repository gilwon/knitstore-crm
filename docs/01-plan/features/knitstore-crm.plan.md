# KnitStore CRM Planning Document

> **Summary**: 뜨개 공방/스토어 전용 CRM - 로트 기반 재고 관리 + 수강생/수강권 관리 + 통합 POS
>
> **Project**: KnitStore Manager
> **Version**: 0.1.0
> **Author**: gilwon
> **Date**: 2026-03-09
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 일반 POS/CRM은 염색 로트(Dye Lot) 단위 재고 관리가 불가능하고, 수강생별 수강권/출석을 체계적으로 관리할 수 없어 강사가 수기로 관리해야 한다 |
| **Solution** | 로트 번호 기반 정밀 재고 시스템 + 수강생/수강권 관리 + 태블릿 최적화 통합 POS를 단일 SaaS 플랫폼으로 제공 |
| **Function/UX Effect** | 로트 혼합 경고로 판매 실수 방지, 수강생 수강권 잔여 현황 즉시 확인, 태블릿에서 실 판매+수강료 결제 동시 처리 |
| **Core Value** | 뜨개 공방 운영자가 관리 업무 대신 강의와 고객 관계에 집중할 수 있게 하는 맞춤형 도구 |

---

## 1. Overview

### 1.1 Purpose

뜨개 공방 강사와 스토어 오너가 겪는 두 가지 핵심 문제를 해결한다:
1. **로트(Dye Lot) 관리**: 동일 품번이라도 염색 차수가 다르면 톤 차이가 나서 완성품을 망칠 수 있음. 일반 POS는 바코드(품번) 단위까지만 관리 가능
2. **수강생/수강권 관리**: 수강생별 수강권 잔여 횟수, 출석 이력을 체계적으로 기록할 수단이 없음

### 1.2 Background

- 뜨개 공방은 '판매'와 '교육'이 동시에 이루어지는 복합 비즈니스
- 기존 솔루션(일반 POS, 엑셀, 수첩)으로는 로트 정밀 관리와 수강 이력 통합이 불가
- 타겟: 오프라인 뜨개 공방 강사, 로컬 뜨개 스토어 오너

### 1.3 Related Documents

- Requirements: `docs/crm_plan.md` (원본 기획안)

---

## 2. Scope

### 2.1 In Scope (MVP)

- [x] 로트(Dye Lot) 번호 기반 재고 등록/조회/차감
- [x] 로트 혼합 판매 경고 시스템
- [x] 수강생 프로필 관리 (이름, 연락처, 메모)
- [x] 수강권 등록 및 출석 시 자동 차감
- [x] 실 판매 + 수강료 처리 통합 POS 화면 (태블릿 최적화)
- [x] 강사(오너) 인증 및 기본 권한 관리
- [x] 반응형 웹 UI (태블릿/모바일 우선)

### 2.2 Out of Scope (v1 이후)

- **수강생 프로젝트(도안) 관리 및 진도율 기록** (v2 예정)
- **수강생별 사용 실 로트 번호 연결 기록** (v2 예정)
- 카카오 알림톡 연동
- 바코드 카메라 스캔 (WebRTC/ZXing)
- 멀티 테넌트 (여러 공방 독립 운영)
- 직원별 계정 (Pro 플랜)
- 월별 매출 통합 리포트/차트
- 온라인 결제 연동 (Stripe/토스)
- 수강생 셀프서비스 앱 (예약/진도 확인)
- 오프라인 모드 (PWA/Service Worker)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 상품 등록 시 품번 + 로트 번호 단위로 재고 분리 관리. 재고 단위는 상품별로 볼(ball) 또는 g 중 선택 | High | ✅ Done |
| FR-02 | 로트별 입고 등록: 수량 입력 시 해당 로트 재고에 **+** 반영 | High | ✅ Done |
| FR-03 | 로트별 출고 등록: 수량 입력 시 해당 로트 재고에 **-** 반영 (재고 부족 시 차단) | High | ✅ Done |
| FR-04 | 로트별 현재고 조회 (입고 누적 - 출고 누적 = 현재고) | High | ✅ Done |
| FR-05 | 입고/출고 이력 조회 (날짜, 수량, 사유, 메모) | Medium | ✅ Done |
| FR-06 | 판매 시 동일 로트 수량 부족하면 혼합 경고 표시 | High | ✅ Done |
| FR-07 | 수강생 프로필 CRUD (이름, 연락처, 메모) | High | ✅ Done |
| FR-08 | 수강권 종류 관리 (횟수제: N회, 기간제: N일) | High | ✅ Done |
| FR-09 | 출석 체크 시 수강권 자동 차감 + 잔여 횟수 표시 | High | ✅ Done |
| FR-10 | 실 판매 POS 화면 (상품 검색, 수량 입력, 로트 선택) | High | ✅ Done |
| FR-11 | 수강료 결제 POS 화면 (수강권 구매/연장) | Medium | ✅ Done |
| FR-12 | 재고 부족 알림 (로트별 임계값 설정) | Medium | ✅ Done |
| FR-13 | 강사(오너) 이메일 로그인/회원가입 | High | ✅ Done |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 페이지 로드 < 2초 (태블릿 기준) | Lighthouse |
| Responsive | 태블릿(768px+) 우선, 모바일(375px+) 지원 | 실기기 테스트 |
| Security | Supabase RLS로 공방별 데이터 격리 | RLS 정책 검증 |
| Usability | 강사가 10분 내 기본 조작 가능 | 사용자 테스트 |
| Availability | 99.5% uptime (Supabase+Vercel 기반) | 모니터링 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] 모든 High 우선순위 기능 요구사항 구현 완료
- [ ] 태블릿(iPad) 환경에서 주요 플로우 정상 동작
- [x] Supabase RLS 정책 적용 완료
- [ ] 주요 비즈니스 로직 테스트 작성
- [ ] 코드 리뷰 완료

### 4.2 Quality Criteria

- [x] TypeScript strict mode 적용
- [ ] ESLint + Prettier 설정 및 에러 0건 (ESLint ✅, Prettier 미설정)
- [x] 빌드 성공 (next build)
- [x] 로트 혼합 경고 로직 엣지케이스 검증

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 로트 관리 UX 복잡도 | High | High | 입고/판매 플로우를 최대한 단순화, 자동 로트 선택(FIFO) 기본 제공 |
| 수강권 차감 로직 오류 | High | Medium | 차감 전 확인 다이얼로그 + 트랜잭션 처리로 데이터 무결성 보장 |
| 태블릿 터치 UX | Medium | Medium | 큰 터치 타겟(44px+), 스와이프 최소화, 모달 대신 풀페이지 전환 |
| Supabase 무료 티어 제한 | Medium | Low | MVP 단계에서는 충분, 사용량 모니터링 후 유료 전환 계획 |
| 뜨개 도메인 용어 혼동 | Low | Medium | 용어 사전(Schema 문서)을 먼저 정의하고 UI에 일관 적용 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure (`components/`, `lib/`, `types/`) | Static sites, portfolios, landing pages | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs, fullstack apps | ☑ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems, complex architectures | ☐ |

> **Dynamic 선정 이유**: 인증 + DB(재고/수강생/수강권) + 실시간 데이터가 필요한 SaaS MVP. Supabase를 BaaS로 활용하여 백엔드 서버 없이 구축.

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | **Next.js (App Router)** | SSR/SSG 지원, 기획안 권장 스택, 태블릿 웹앱에 최적 |
| State Management | Context / Zustand / Redux | **Zustand** | 경량, 보일러플레이트 최소, POS 상태 관리에 적합 |
| API Client | fetch / react-query | **TanStack Query + Supabase Client** | 서버 상태 캐싱, 낙관적 업데이트로 POS 반응성 확보 |
| Form Handling | react-hook-form / native | **react-hook-form** | 상품 등록/수강생 등록 등 폼이 많은 앱에 필수 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS + shadcn/ui** | 기획안 권장, 빠른 반응형 UI 구축 |
| Testing | Jest / Vitest / Playwright | **Vitest + Playwright** | 단위 테스트(Vitest) + E2E(Playwright) |
| Backend/DB | Supabase / Custom Server | **Supabase (PostgreSQL)** | 기획안 권장, Auth/DB/RLS/Realtime 통합 제공 |
| Deployment | Vercel / AWS | **Vercel** | Next.js 최적 호스팅, 무료 티어로 MVP 가능 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Folder Structure:
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # 인증 관련 페이지 (login, signup)
│   ├── (dashboard)/        # 인증 후 메인 레이아웃
│   │   ├── inventory/      # 재고 관리
│   │   ├── students/       # 수강생 관리
│   │   ├── pos/            # POS 화면
│   │   └── settings/       # 설정
│   └── layout.tsx
├── components/
│   ├── ui/                 # shadcn/ui 기본 컴포넌트
│   └── shared/             # 공통 컴포넌트 (Header, Sidebar 등)
├── features/
│   ├── inventory/          # 재고/로트 관리 기능
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── queries.ts
│   ├── students/           # 수강생/수강권 기능
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── queries.ts
│   └── pos/                # POS 기능
│       ├── components/
│       ├── hooks/
│       ├── types.ts
│       └── store.ts        # Zustand POS 상태
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Supabase 브라우저 클라이언트
│   │   ├── server.ts       # Supabase 서버 클라이언트
│   │   └── middleware.ts   # Auth 미들웨어
│   └── utils.ts
└── types/
    └── database.ts         # Supabase 자동생성 타입
```

### 6.4 Core Data Model (High-Level)

```
[shops] 1──N [products] 1──N [lots]
   │              │             │
   │              │             ├── stock_quantity (현재고 = 입고합 - 출고합)
   │              │             ├── lot_number
   │              │
   │              └── unit: "ball" | "g" (상품별 재고 단위)
   │                            │
   │                            └── 1──N [stock_movements]
   │                                    ├── type: "in" (입고) | "out" (출고)
   │                                    ├── quantity (양수)
   │                                    ├── reason (구매입고/반품/판매/폐기 등)
   │                                    ├── memo
   │                                    └── created_at
   │
   ├── 1──N [students] 1──N [subscriptions]
   │            │               │
   │            │               └── type(횟수/기간), remaining, expires_at
   │            │
   │            └── 1──N [attendances]
   │                        └── date, subscription_id
   │
   └── 1──N [sales]
               ├── sale_items (lot_id 참조 → 자동 출고 연동)
               └── type (product_sale / class_fee)

[v2 예정] students 1──N [projects] (도안, 진도율, 사용 실 로트 연결)
```

> **재고 가감 로직**: 입고(in) 등록 → lots.stock_quantity += quantity / 출고(out) 등록 → lots.stock_quantity -= quantity (현재고 < 출고량이면 차단). POS 판매 시 sale_items 생성과 동시에 출고 이력 자동 생성.

> 상세 스키마는 Design 단계에서 정의

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists
- [x] ESLint configuration (`eslint.config.mjs`)
- [ ] Prettier configuration (`.prettierrc`)
- [x] TypeScript configuration (`tsconfig.json`)

> 신규 프로젝트이므로 모두 새로 생성 필요

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | 컴포넌트: PascalCase, 함수/변수: camelCase, 파일: kebab-case | High |
| **Folder structure** | missing | Dynamic 레벨 feature-based 구조 (6.3 참조) | High |
| **Import order** | missing | 1.React/Next → 2.외부 → 3.내부 → 4.types → 5.styles | Medium |
| **Environment variables** | missing | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | High |
| **Error handling** | missing | TanStack Query onError + toast 알림 패턴 | Medium |
| **Korean/English** | missing | 코드: 영문, UI 텍스트: 한국어, 커밋: 영문 | High |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client | ☑ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | Client | ☑ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 (서버 전용) | Server | ☑ |

### 7.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 1 (Schema) | ☐ | `docs/01-plan/schema.md` | `/phase-1-schema` |
| Phase 2 (Convention) | ☐ | `docs/01-plan/conventions.md` | `/phase-2-convention` |

---

## 8. Implementation Phases (MVP Roadmap)

### Phase 1: 프로젝트 초기화 + DB 스키마 (1주)
- [x] Next.js + Supabase + shadcn/ui 프로젝트 셋업
- [x] Supabase 테이블 설계 및 마이그레이션
- [x] RLS 정책 설정
- [x] 인증 플로우 (이메일 로그인/회원가입)

### Phase 2: 재고/로트 관리 (1~2주)
- [x] 상품 등록/수정/삭제 CRUD
- [x] 로트 번호별 재고 조회 화면
- [x] 입고 등록 (수량 입력 → stock_quantity + 반영)
- [x] 출고 등록 (수량 입력 → stock_quantity - 반영, 재고 부족 시 차단)
- [x] 입고/출고 이력 목록 조회
- [x] 로트 혼합 경고 로직
- [x] 재고 부족 알림 임계값 설정

### Phase 3: 수강생/수강권 관리 (1~2주)
- [x] 수강생 프로필 CRUD
- [x] 수강권 등록 (횟수제/기간제)
- [x] 출석 체크 및 수강권 자동 차감

### Phase 4: POS 통합 화면 (1주)
- [x] 실 판매 POS (상품 검색 → 로트 선택 → 결제)
- [x] 수강료 결제 POS (수강권 구매/연장)
- [x] 태블릿 최적화 UI

---

## 9. Next Steps

1. [x] Design 문서 작성 (`knitstore-crm.design.md`) - 상세 DB 스키마, API 설계, UI 와이어프레임
2. [ ] Phase 1 Schema 정의 (`/phase-1-schema`)
3. [ ] Phase 2 Convention 정의 (`/phase-2-convention`)
4. [x] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-09 | Initial draft | gilwon |
| 0.2 | 2026-03-09 | 수강생 진도 관리(프로젝트/도안) Out of Scope(v2)로 이동 | gilwon |
| 0.3 | 2026-03-09 | 상품별 재고 단위(볼/g) 선택 기능 추가 (A방식) | gilwon |
