/**
 * POST /api/orders
 * 비회원 주문 생성
 * - 서버에서 DB 가격으로 재계산 (클라이언트 가격 신뢰하지 않음)
 * - place_cafe_order RPC 호출
 * - 기본적인 입력 검증 및 요청 크기 제한
 *
 * 주의: 서버리스 환경에서 in-memory rate limit은
 * 인스턴스가 여러 개로 나뉘면 보장되지 않습니다.
 * 운영환경에서는 Vercel KV, Redis 등 외부 스토어를 사용하세요.
 */
import { getSupabaseAdmin, parseJsonBody, dbError, sendError, handlePreflight, HttpError } from './_supabase.js'

// 간단한 in-memory 요청 횟수 제한 (개발/소규모 환경용)
const requestCounts = new Map()
const RATE_LIMIT = 10        // 10분당 최대 요청 수
const RATE_WINDOW_MS = 600000 // 10분

function isRateLimited(ip) {
  const now = Date.now()
  const entry = requestCounts.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS }

  if (now > entry.reset) {
    requestCounts.set(ip, { count: 1, reset: now + RATE_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT) return true

  entry.count++
  requestCounts.set(ip, entry)
  return false
}

export default async function handler(req, res) {
  if (handlePreflight(req, res, ['POST'])) return

  // 요청 크기 제한 검사 (~10KB)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10)
  if (contentLength > 10240) {
    return res.status(413).json({ error: '요청 크기가 너무 큽니다.', code: 'PAYLOAD_TOO_LARGE' })
  }

  // IP 기반 rate limit (서버리스 in-memory: 개발용)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
      code: 'RATE_LIMITED',
    })
  }

  try {
    const { items } = parseJsonBody(req)

    // 입력 검증
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '주문 항목이 없습니다.' })
    }

    if (items.length > 20) {
      return res.status(400).json({ error: '주문 항목이 너무 많습니다. (최대 20종)' })
    }

    const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
    if (totalQty > 20) {
      return res.status(400).json({ error: '총 주문 수량이 20개를 초과합니다.' })
    }

    for (const item of items) {
      const menuId = Number(item.menu_id)
      const qty = Number(item.quantity)

      if (!Number.isInteger(menuId) || menuId <= 0) {
        return res.status(400).json({ error: '유효하지 않은 메뉴 ID입니다.' })
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
        return res.status(400).json({ error: '유효하지 않은 수량입니다. (1~20)' })
      }
    }

    // RPC 호출 - 서버에서 DB 가격 기준으로 계산
    const p_items = items.map(i => ({
      menu_id: Number(i.menu_id),
      quantity: Number(i.quantity),
    }))

    const { data, error } = await getSupabaseAdmin().rpc('place_cafe_order', {
      p_items: p_items,
    })

    if (error) {
      console.error('place_cafe_order 오류:', error.code, error.message, error.details || '', error.hint || '')
      // P0001: 함수 내부 RAISE EXCEPTION (판매중지/존재하지 않는 메뉴 등 비즈니스 검증 실패)
      // 22xxx: 잘못된 데이터, 23xxx: 무결성 제약 위반 → 클라이언트 요청 문제(400)
      if (error.code === 'P0001' || /^2[23]/.test(error.code || '')) {
        throw new HttpError(
          400,
          '선택한 메뉴를 주문할 수 없습니다. 메뉴 상태를 확인해 주세요.',
          'ORDER_REJECTED',
          process.env.NODE_ENV === 'production' ? undefined : error.message
        )
      }
      // 권한(42501), 함수 없음(PGRST202) 등 서버/DB 설정 문제 → 500
      throw dbError(error, '주문 처리 중 오류가 발생했습니다.')
    }

    // RETURNS TABLE → 배열, RETURNS record/json → 객체 둘 다 대응
    const result = Array.isArray(data) ? data[0] : data
    if (!result || result.order_id == null) {
      throw new HttpError(502, '주문 결과를 받지 못했습니다.', 'EMPTY_RPC_RESULT')
    }

    return res.status(201).json({
      order_id: result.order_id,
      lookup_token: result.lookup_token,
      total_price: result.total_price,
      status: result.status,
    })
  } catch (err) {
    return sendError(res, err, '주문 생성')
  }
}
