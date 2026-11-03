-- =============================================
-- CafeOrder 추가 SQL 마이그레이션
-- 기존 테이블(menus, orders, order_items)과
-- place_cafe_order 함수는 삭제하거나 변경하지 않습니다.
--
-- 실행 방법:
-- Supabase 대시보드 > SQL Editor에서 아래 SQL을 실행하세요.
-- =============================================

-- ─────────────────────────────────────────────
-- 1. orders 테이블 status 제약조건 확인/추가
--    이미 설정되어 있으면 SKIP (오류 무시)
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_status_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_check
      CHECK (status IN ('접수', '제조중', '완료', '취소'));
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 2. place_cafe_order 함수 GRANT 확인
--    현재 service_role에만 권한이 있으므로
--    서버(service_role)에서 호출합니다.
--    아래는 참고용 확인 쿼리입니다.
-- ─────────────────────────────────────────────
-- SELECT grantee, privilege_type
-- FROM information_schema.routine_privileges
-- WHERE routine_name = 'place_cafe_order';

-- ─────────────────────────────────────────────
-- 3. menus 테이블 RLS 확인
--    고객 화면은 클라이언트(publishable key)에서
--    is_available=true인 메뉴만 읽습니다.
--    RLS가 설정되어 있는지 확인하세요.
-- ─────────────────────────────────────────────

-- menus 테이블 RLS 활성화 (이미 되어 있으면 SKIP)
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (is_available=true만)
-- 이미 존재하면 DROP 후 재생성
DROP POLICY IF EXISTS "menus_public_read" ON public.menus;
CREATE POLICY "menus_public_read"
  ON public.menus
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

-- service_role은 RLS 우회하므로 별도 정책 불필요

-- ─────────────────────────────────────────────
-- 4. orders 테이블 RLS
--    고객은 orders에 직접 접근 불가
--    (서버의 service_role 통해서만 접근)
-- ─────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거
DROP POLICY IF EXISTS "orders_no_public_access" ON public.orders;

-- 공개 접근 완전 차단 (서버만 service_role로 접근)
CREATE POLICY "orders_no_public_access"
  ON public.orders
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ─────────────────────────────────────────────
-- 5. order_items 테이블 RLS
-- ─────────────────────────────────────────────
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_no_public_access" ON public.order_items;

CREATE POLICY "order_items_no_public_access"
  ON public.order_items
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ─────────────────────────────────────────────
-- 6. 중복 주문 방지를 위한 참고 사항
--    (실서비스 수준의 중복 방지가 필요한 경우)
--
-- 동일 세션/IP에서 동시에 같은 메뉴로 중복 주문하는 것을
-- DB 레벨에서 완전히 막으려면 idempotency key가 필요합니다.
--
-- 아래는 선택적으로 적용할 수 있는 idempotency 컬럼입니다.
-- orders 테이블에 추가:
-- ─────────────────────────────────────────────
/*
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- place_cafe_order 함수 수정이 필요합니다.
-- 클라이언트에서 UUID를 생성하여 함께 전송:
-- { items: [...], idempotency_key: "uuid-v4" }
-- 서버에서 중복 감지 후 기존 주문을 반환합니다.
*/

-- ─────────────────────────────────────────────
-- 완료 메시지
-- ─────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE 'CafeOrder 마이그레이션 완료';
END $$;
