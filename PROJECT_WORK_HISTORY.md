# ☕ CafeOrder 프로젝트 작업 히스토리 및 전체 구현 보고서

본 문서는 **CafeOrder(카페 주문 관리 웹 시스템)** 프로젝트의 최초 분석부터 로컬 개발 서버 기동, 기능 검증, Git/GitHub 연동, Vercel 프로덕션 배포, 브라우저 E2E 자동화 테스트, 3D 일러스트 에셋 제작, 그리고 모던 미니멀 프리미엄 카페 스타일로의 UI/UX 고도화까지 진행된 모든 작업 과정을 체계적으로 기록한 문서입니다.

---

## 📌 목차
1. [프로젝트 개요 및 기술 스택](#1-프로젝트-개요-및-기술-스택)
2. [프로젝트 분석 및 로컬 개발 환경 구축](#2-프로젝트-분석-및-로컬-개발-환경-구축)
3. [백엔드 API 및 데이터베이스 정밀 검증](#3-백엔드-api-및-데이터베이스-정밀-검증)
4. [GitHub 원격 저장소 연동 및 보안 조치](#4-github-원격-저장소-연동-및-보안-조치)
5. [Vercel Production 환경 배포 및 환경 변수 등록](#5-vercel-production-환경-배포-및-환경-변수-등록)
6. [실제 브라우저(Puppeteer + Chrome) E2E 고객 주문 자동화 테스트](#6-실제-브라우저puppeteer--chrome-e2e-고객-주문-자동화-테스트)
7. [3D 일러스트 스타일 카페 메뉴 8종 에셋 제작](#7-3d-일러스트-스타일-카페-메뉴-8종-에셋-제작)
8. [UI/UX 개편 1단계: 미니멀 프리미엄 카페 테마](#8-uiux-개편-1단계-미니멀-프리미엄-카페-테마)
9. [UI/UX 개편 2단계: 첫 화면(First Fold) 레이아웃 최적화](#9-uiux-개편-2단계-첫-화면first-fold-레이아웃-최적화)
10. [UI/UX 개편 3단계: 모던 미니멀 헤더 & 메인 환영 영역 고도화](#10-uiux-개편-3단계-모던-미니멀-헤더--메인-환영-영역-고도화)
11. [최종 배포 현황 및 산출물 링크](#11-최종-배포-현황-및-산출물-링크)

---

## 1. 프로젝트 개요 및 기술 스택

* **프로젝트명**: CafeOrder (브랜드명: `coffee house.`)
* **목적**: 고등학생 프로그래밍 실습 및 실무형 카페 키오스크/웹 주문 관리 시스템
* **프론트엔드**: React 19, Vite 8, Tailwind CSS v4, React Router Dom v7, Context API
* **백엔드**: Node.js 로컬 커스텀 런타임(`scripts/dev-api.mjs`) 및 Vercel Serverless Functions (`api/`)
* **데이터베이스 & 인증**: Supabase PostgreSQL (`menus`, `orders`, `order_items`, RPC `place_cafe_order`), Supabase Auth
* **배포 인프라**: Vercel (Production) + GitHub CI/CD

---

## 2. 프로젝트 분석 및 로컬 개발 환경 구축

### 2.1 아키텍처 및 라우팅 분석
* Vite 프론트엔드가 포트 `5173`, 로컬 API 서버가 포트 `3000`에서 실행되며, `vite.config.js` 프록시를 통해 프론트엔드의 `/api/*` 요청이 로컬 API 서버로 포워딩되는 구조를 파악했습니다.
* `api/_supabase.js`를 통해 서버 전용 `service_role` 키를 안전하게 격리 사용하는 아키텍처를 확인했습니다.

### 2.2 Supabase 연결 점검 및 스크립트 수정
* Supabase 연결 점검 스크립트(`scripts/check-supabase.mjs`) 실행 중 실제 DB 테이블의 기본 키가 `id`가 아닌 `menu_id`로 되어 있어 정렬 쿼리 오류가 발생하는 것을 감지했습니다.
* `order('id')` → `order('menu_id')`로 수정하여 메뉴 8건(`아메리카노`, `카페라떼`, `바닐라라떼`, `카푸치노`, `레몬에이드`, `초코라떼`, `치즈케이크`, `초코쿠키`) 정상 조회를 완료했습니다.

### 2.3 개발 서버 동시 구동
* `npm run dev:all` 명령을 백그라운드 데몬으로 실행하여 Vite(5173)와 API 서버(3000)를 성공적으로 기동했습니다.

---

## 3. 백엔드 API 및 데이터베이스 정밀 검증

지침("실제로 테스트하지 않은 기능을 정상이라고 판단하지 마")에 따라 단계별 검증을 수행했습니다:

1. **메뉴 조회 (DB 레벨)**:
   * Supabase 클라이언트를 통해 `menus` 테이블의 8개 메뉴 조회 성공.
2. **주문 등록 API (`POST /api/orders`)**:
   * 로컬 서버로 아메리카노 1개(2,000원) 주문 요청 전송 → `201 Created` 응답 수신.
   * `order_id: 4`, 본인 확인용 `lookup_token`, 상태 `접수` 정상 발급 확인.
3. **데이터베이스 무결성 검증**:
   * Supabase DB 직접 조회를 통해 `orders` 테이블(4번)과 `order_items` 테이블(7번 아이템)이 원자적으로 정확히 생성되었음을 검증.
4. **주문 상세 조회 API (`GET /api/orders/:id?token=...`)**:
   * 발급된 `lookup_token`을 검증하여 주문 상세 내역이 정확하게 반환됨을 확인.
5. **관리자 API 보안 검증 (`/api/admin/*`)**:
   * 토큰 없이 관리자 API 접근 시 `401 AUTH_REQUIRED`로 차단되는 보안 로직 동작 확인.

---

## 4. GitHub 원격 저장소 연동 및 보안 조치

1. **보안 제외 설정**:
   * `.env.local`, `.env`, 테스트 캡처 디렉터리 등을 [`.gitignore`](file:///c:/Users/User/Desktop/anti_project/CafeOrder/.gitignore)에 확실히 등록하여 민감한 API 키 유출을 차단했습니다.
2. **Git 초기화 및 커밋**:
   * `git init` 및 기본 브랜치를 `main`으로 설정.
   * 최초 프로젝트 소스코드 46개 파일 커밋 생성.
3. **원격 저장소 연결 및 푸시**:
   * 원격 저장소 [https://github.com/newv7437/CafeOrder](https://github.com/newv7437/CafeOrder) 연결.
   * Windows 터미널 자격 증명(Git Credential Manager)을 통해 푸시 완료.

---

## 5. Vercel Production 환경 배포 및 환경 변수 등록

1. **Vercel 계정 연동**:
   * `park-min-woo/cafe-order` 프로젝트와 로컬 프로젝트 정상 연동.
2. **환경 변수 등록 (보안 준수)**:
   * Node.js 자동화 스크립트를 작성하여 터미널 로그 및 화면에 비밀 키를 전혀 출력하지 않고, 아래 5개 변수를 Vercel `Production`, `Preview`, `Development` 전 환경에 등록 완료:
     * `VITE_SUPABASE_URL`
     * `VITE_SUPABASE_PUBLISHABLE_KEY`
     * `SUPABASE_URL`
     * `SUPABASE_SERVICE_ROLE_KEY`
     * `ADMIN_USER_IDS`
3. **프론트엔드 번들 보안 스캔**:
   * 프로덕션 빌드 번들 자바스크립트 전체를 스캔하여, 실제 `SUPABASE_SERVICE_ROLE_KEY` 값이 클라이언트 번들에 전혀 포함되지 않았음을 검증 완료.
4. **프로덕션 배포 완료**:
   * `npx vercel --prod --yes` 명령으로 프로덕션 배포 완료 (`READY` 상태).
   * 주소: [https://cafe-order-drab.vercel.app](https://cafe-order-drab.vercel.app)
5. **실제 배포 사이트 API 테스트**:
   * 배포된 실제 도메인에서 `POST /api/orders` 주문 생성 테스트 성공 (`order_id: 6`).
   * 주문 조회 `GET /api/orders/6?token=...` 정상 동작 확인.

---

## 6. 실제 브라우저(Puppeteer + Chrome) E2E 고객 주문 자동화 테스트

사용자 PC에 설치된 Chrome 브라우저 바이너리를 탐색하여, `puppeteer-core` 기반의 실제 브라우저 E2E 테스트 스크립트([`scripts/customer-test.mjs`](file:///c:/Users/User/Desktop/anti_project/CafeOrder/scripts/customer-test.mjs))를 구축하고 실행했습니다:

```
[1] Chrome 브라우저 실행 ──> [2] 웹사이트 접속 ──> [3] 메뉴 로드 확인
      ──> [4] 장바구니 담기(아메리카노+카페라떼) ──> [5] 주문 모달 확인 ──> [6] 주문 완료 페이지(#8) 도착
```

* **실제 검증 결과**:
  * 아메리카노(2,000원) + 카페라떼(3,000원) 선택 → 장바구니 합계 2개 / 5,000원 정상 갱신.
  * 주문 모달 팝업 및 최종 주문하기 클릭 → 서버리스 함수 호출 및 DB 저장.
  * 주문번호 **#8** 생성 및 `/order/8?token=...` 페이지 자동 리다이렉트 및 진행 상황 [접수] 불빛 렌더링 확인.
* **캡처 산출물**: [`test-screenshots/`](file:///c:/Users/User/Desktop/anti_project/CafeOrder/test-screenshots) (메뉴 로드, 장바구니 담김, 주문 모달, 주문 접수 완료 총 4장 캡처)

---

## 7. 3D 일러스트 스타일 카페 메뉴 8종 에셋 제작

기존의 기본 텍스트 이모지(☕)를 대체하기 위해 이미지 생성 서브에이전트(`image-generator`)를 활용하여 일관된 3D 클레이 / 블렌더 렌더링 스타일의 메뉴 이미지 8종을 제작했습니다:

| 메뉴명 | 파일명 | 3D 비주얼 스타일 요약 |
| :--- | :--- | :--- |
| **아메리카노** | `americano.jpg` | 투명한 유리잔 속 얼음과 깊고 풍부한 에스프레소 앰버 그라데이션 |
| **카페라떼** | `latte.jpg` | 따스한 세라믹 잔 위 정교한 하트 라떼 아트 폼과 훈훈한 감성 |
| **바닐라라떼** | `vanilla_latte.jpg` | 황금빛 바닐라 시럽 층, 신선한 우유, 에스프레소가 층을 이룬 아이스 라떼 |
| **카푸치노** | `cappuccino.jpg` | 구름처럼 몽실한 밀크폼 돔 위에 은은한 코코아 파우더가 토핑된 클래식 컵 |
| **레몬에이드** | `lemonade.jpg` | 청량한 탄산 기포와 신선한 생레몬 슬라이스, 허브 잎이 싱그러운 옐로우 에이드 |
| **초코라떼** | `choco_latte.jpg` | 진한 더치 초콜릿 마블링과 소복한 휘핑크림 & 초코 시럽 드리즐 |
| **치즈케이크** | `cheesecake.jpg` | 노릇하게 구워진 크러스트와 부드러운 단면의 뉴욕 베이크드 조각 케이크 |
| **초코쿠키** | `choco_cookie.jpg` | 겉바속촉 크랙과 큼직한 다크 초콜릿 청크가 박힌 아메리칸 클래식 쿠키 |

* 에셋 저장 경로: [`public/images/menus/`](file:///c:/Users/User/Desktop/anti_project/CafeOrder/public/images/menus)
* 매핑 모듈 구현: [`src/lib/menuImages.js`](file:///c:/Users/User/Desktop/anti_project/CafeOrder/src/lib/menuImages.js)

---

## 8. UI/UX 개편 1단계: 미니멀 프리미엄 카페 테마

사용자가 제시한 "블루보틀 같은 스페셜티 카페 감성"을 바탕으로 1차 개편을 진행했습니다:
* **컬러 팔레트**: 따뜻한 웜 아이보리/크림 (`#FBF9F5`) + 딥 에스프레소 브라운 (`#3D271D`)
* **메뉴 카드**: 큰 3D 이미지 중심 카드 배치, 소프트 섀도우 효과
* **카테고리**: `전체`, `커피`, `논커피`, `디저트` 둥근 필 탭 적용
* **장바구니 패널**: 오른쪽 스티키 고정 패널, 미니 썸네일 노출, 커다란 브라운 주문 버튼

---

## 9. UI/UX 개편 2단계: 첫 화면(First Fold) 레이아웃 최적화

사용자 피드백을 수렴하여 실용성을 대폭 강화했습니다:
1. **불필요한 배지 제거**: 카드 상단의 `★ 4.8` 평점 배지와 영문 대문자 서브텍스트(`CHUNKY DARK CHOCOLATE` 등)를 완전히 제거하여 카드 시각 피로도를 낮췄습니다.
2. **슬로건 한 줄 처리**: 두 줄로 나뉘던 영문 슬로건을 `Enjoy the real taste of coffee.` 한 줄로 정돈했습니다.
3. **상단 밀착 최적화**: 헤더 및 히어로 여백을 대폭 줄여, **사용자가 사이트에 접속하자마자 스크롤 없이 첫 화면에서 6개 이상의 3D 메뉴 카드와 우측 장바구니가 한눈에 딱 들어오도록** 배치했습니다.

---

## 10. UI/UX 개편 3단계: 모던 미니멀 헤더 & 메인 환영 영역 고도화

기존의 굵은 세리프체가 다소 올드해 보인다는 피드백을 반영하여, 성수동/한남동 스페셜티 카페 스타일의 모던 산세리프 타이포그래피로 완성도를 끌어올렸습니다:

### 10.1 헤더 (Header)
* **브랜드명 변경**: `coffee house.` (트렌디한 소문자 + 마침표 감성)
* **서체 적용**: **Inter / Pretendard SemiBold** (`font-semibold`) 적용
* **보조 문구**: 상단에 정갈한 대문자 자간의 `COFFEE & MOMENTS` 배치
* **아이콘 교체**: 기존 이모지 사각 박스를 대체하여, **심플하고 세련된 미니멀 커피잔 라인 SVG 아이콘** 적용

### 10.2 메인 환영 영역
* **메인 문구 변경**: *"Enjoy the real taste of coffee."* → **"오늘의 커피, 당신의 순간."**
* **서체 및 굵기**: **Pretendard Medium** (`font-medium`)을 사용하여 지나치게 두껍지 않고 부드럽고 서정적인 굵기 표현
* **상단 보조 문구**: 메인 문구 위에 은은한 그레이시 브라운 톤의 `YOUR DAILY COFFEE MOMENT` 배치
* **하단 안내 문구**: 메인 문구 아래에 `"좋아하는 커피를 골라보세요."` 짧은 안내 문구 추가
* **반응형 최적화**: PC, 태블릿, 모바일 뷰포트에서 모두 자연스럽고 유려하게 표시되도록 반응형 레이아웃 완성

---

## 11. 최종 배포 현황 및 산출물 링크

| 구분 | 링크 / 위치 | 설명 |
| :--- | :--- | :--- |
| **🌐 Vercel 프로덕션 URL** | [https://cafe-order-drab.vercel.app](https://cafe-order-drab.vercel.app) | 전 세계 접속 가능한 실시간 라이브 서비스 |
| **🐙 GitHub 리포지토리** | [https://github.com/newv7437/CafeOrder](https://github.com/newv7437/CafeOrder) | 최신 커밋(`bcea849`) 푸시 완료 |
| **💻 로컬 개발 서버** | [http://localhost:5173](http://localhost:5173) | Vite 프론트엔드 + Node.js API 서버 구동 |
| **🖼️ 3D 메뉴 이미지 폴더** | [`public/images/menus/`](file:///c:/Users/User/Desktop/anti_project/CafeOrder/public/images/menus) | 아메리카노 등 8종 고해상도 3D 에셋 |
| **📸 브라우저 캡처 결과물** | [`new-design-screenshots/`](file:///c:/Users/User/Desktop/anti_project/CafeOrder/new-design-screenshots) | PC 및 모바일 반응형 실제 스크린샷 |

---
*작성일자: 2026-11-07*  
*작성자: Antigravity AI Coding Assistant*
