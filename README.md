# ☕ CafeOrder - 카페 주문 관리 시스템

고등학생 프로그래밍 실습용 카페 주문 관리 웹 애플리케이션입니다.
React + Vite 프론트엔드, Vercel Serverless Functions 백엔드, Supabase PostgreSQL 데이터베이스로 구성됩니다.

---

## 🗂️ 프로젝트 구조

```
CafeOrder/
├── api/                        # Vercel Serverless Functions (서버 API)
│   ├── _supabase.js            # 서버 전용 Supabase 클라이언트 (service_role)
│   ├── orders.js               # POST /api/orders (비회원 주문)
│   ├── orders/[id].js          # GET  /api/orders/:id (주문 조회)
│   └── admin/
│       ├── me.js               # GET  /api/admin/me (권한 확인)
│       ├── orders.js           # GET  /api/admin/orders (주문 목록)
│       ├── orders/[id].js      # PATCH /api/admin/orders/:id (상태 변경)
│       ├── menus.js            # GET  /api/admin/menus (메뉴 조회)
│       └── menus/[id].js       # PATCH /api/admin/menus/:id (메뉴 수정)
├── src/
│   ├── context/
│   │   ├── CartContext.jsx     # 장바구니 상태 (localStorage 연동)
│   │   └── AuthContext.jsx     # 인증 상태 (Supabase Auth)
│   ├── components/
│   │   ├── common/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── AdminRoute.jsx  # 관리자 전용 라우트 가드
│   │   └── customer/
│   │       ├── MenuCard.jsx
│   │       ├── CartPanel.jsx
│   │       └── OrderConfirmModal.jsx
│   ├── pages/
│   │   ├── customer/
│   │   │   ├── MenuPage.jsx    # 경로: /
│   │   │   └── OrderPage.jsx   # 경로: /order/:orderId
│   │   └── admin/
│   │       ├── AdminLogin.jsx  # 경로: /admin/login
│   │       └── AdminDashboard.jsx # 경로: /admin
│   ├── lib/
│   │   └── supabase.js         # 클라이언트 Supabase (publishable key만)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── migrations/
│   └── 001_rls_and_constraints.sql
├── .env.example                # 환경변수 예시
├── .env.local                  # 실제 환경변수 (git 제외)
├── vercel.json                 # Vercel 배포 설정
└── vite.config.js
```

---

## ⚙️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 확인하고 아래 값을 채워주세요:

```env
# 클라이언트 공개 키 (VITE_ 접두사)
VITE_SUPABASE_URL=https://ubgwqpafpavrxdpqwoch.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# 서버 전용 비밀 키 (VITE_ 접두사 절대 금지)
SUPABASE_URL=https://ubgwqpafpavrxdpqwoch.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# 관리자 UUID (Supabase Authentication > Users에서 확인)
ADMIN_USER_IDS=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

> **⚠️ 보안 주의**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 `VITE_` 접두사를 붙이면 안 됩니다.
> VITE_ 변수는 브라우저에 노출됩니다.

### 3. Supabase 관리자 계정 생성

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. **Authentication > Users** 메뉴 이동
3. **Add user** → 이메일/비밀번호로 관리자 계정 생성
4. 생성된 사용자의 **UUID** 복사
5. `.env.local`의 `ADMIN_USER_IDS` 값에 붙여넣기

### 4. SQL 마이그레이션 실행

> 기존 테이블(menus, orders, order_items)과 place_cafe_order 함수는 변경되지 않습니다.

1. Supabase 대시보드 > **SQL Editor**
2. `migrations/001_rls_and_constraints.sql` 파일 내용 붙여넣기
3. **Run** 클릭

### 5. 로컬 실행

#### 방법 A: Vite 개발 서버만 (API 프록시 사용)

```bash
npm run dev
```

> Vite의 프록시 설정으로 `/api` 요청을 `localhost:3000`으로 전달합니다.
> 하지만 실제 Vercel Functions가 실행되지 않으므로 API가 동작하지 않습니다.

#### 방법 B: Vercel Functions 포함 통합 실행 (권장)

```bash
npm run dev:full
# 또는
npx vercel dev
```

> `vercel dev` 명령으로 Vite 프론트엔드와 Vercel Functions를 동시에 실행합니다.
> 초기 실행 시 Vercel 계정 연결이 필요할 수 있습니다.

**Vercel CLI 로그인 (최초 1회):**

```bash
npx vercel login
```

### 6. 빌드

```bash
npm run build
```

---

## 🚀 Vercel 배포

### 방법 A: Vercel 대시보드 (권장)

1. [vercel.com](https://vercel.com) 접속 후 로그인
2. **New Project** → GitHub 저장소 연결
3. **Environment Variables** 탭에서 아래 변수 추가:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_USER_IDS`
4. **Deploy** 클릭

> `VITE_` 변수도 Vercel에 추가하면 빌드 시 사용됩니다.

### 방법 B: CLI

```bash
npx vercel --prod
```

---

## 🧪 전체 테스트 절차

### Step 1: 고객 주문 플로우

1. `http://localhost:3000` 접속 (또는 배포 URL)
2. 메뉴 목록이 표시되는지 확인 (Supabase menus 테이블에서 조회)
3. 카테고리 필터(커피/음료/디저트) 동작 확인
4. 메뉴 카드의 **장바구니 담기** 클릭
5. 동일 메뉴 여러 번 클릭 → 수량 증가 확인
6. 우측(또는 하단 버튼) 장바구니 패널에서 수량 조절/삭제
7. **주문하기** 버튼 클릭
8. 주문 확인 모달에서 내역 확인 후 **주문하기** 클릭
9. `/order/:orderId` 페이지로 이동 확인
10. 주문번호, 메뉴, 금액, 상태(접수) 표시 확인
11. 5초마다 상태가 자동 갱신되는지 확인

### Step 2: 새로고침 후 주문 조회

1. `/order/:orderId` 페이지에서 새로고침
2. lookup_token이 localStorage에서 복원되어 주문 조회 성공 확인
3. 다른 브라우저에서 주문번호만 입력 시 조회 실패 확인

### Step 3: 관리자 로그인

1. `/admin/login` 접속
2. Supabase에서 생성한 관리자 계정으로 로그인
3. 관리자 대시보드로 이동 확인
4. 일반 사용자 계정(ADMIN_USER_IDS에 없는)으로 로그인 시 접근 거부 확인

### Step 4: 주문 상태 변경

1. 관리자 대시보드에서 주문 목록 확인
2. **→ 제조중** 버튼 클릭 → 확인 팝업 → 상태 변경
3. 고객 화면(`/order/:orderId`)에서 상태가 **제조중**으로 바뀌는지 확인
4. **→ 완료** 버튼 클릭 → 상태 변경
5. 고객 화면에서 **완료** 상태 및 완료 배너 확인

### Step 5: 메뉴 관리

1. 관리자 대시보드 **메뉴 관리** 탭 클릭
2. **수정** 버튼 → 가격 변경 → **저장**
3. 고객 화면 새로고침 후 변경된 가격 확인
4. **판매** 체크박스 해제 → 저장
5. 고객 화면에서 해당 메뉴가 사라지는 확인

---

## 🔒 보안 구조

| 항목 | 방법 |
|------|------|
| 비밀키 보호 | `SUPABASE_SERVICE_ROLE_KEY`는 Vercel 서버 환경변수에만 |
| 클라이언트 키 | `VITE_SUPABASE_PUBLISHABLE_KEY` (공개 가능) |
| 관리자 인증 | Supabase Auth JWT 토큰 + `ADMIN_USER_IDS` 환경변수 비교 |
| 주문 조회 | `lookup_token` (UUID) 없이 조회 불가 |
| 가격 신뢰 | 서버에서 DB 가격 재계산 (클라이언트 가격 무시) |
| RLS | orders, order_items는 anon/authenticated 직접 접근 차단 |
| SQL Injection | Supabase 클라이언트 파라미터 바인딩 사용 |

---

## 🛠️ 기술 스택

- **프론트엔드**: React 19 + Vite 8 + Tailwind CSS v4
- **백엔드**: Vercel Serverless Functions (Node.js 20)
- **데이터베이스**: Supabase PostgreSQL
- **인증**: Supabase Auth (이메일/비밀번호)
- **배포**: Vercel

---

## 📝 개발 시 주의사항

### Rate Limiting

현재 `api/orders.js`의 rate limit은 **in-memory** 방식입니다.  
서버리스 환경에서 인스턴스가 여러 개로 확장되면 제한이 공유되지 않습니다.  
운영환경에서는 **Vercel KV**, **Upstash Redis** 등 외부 스토어를 사용하세요.

### 중복 주문 방지

네트워크 재시도로 인한 중복 주문을 완전히 방지하려면  
`migrations/001_rls_and_constraints.sql`의 idempotency_key 섹션을 참고하세요.
