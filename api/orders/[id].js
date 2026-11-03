/**
 * GET /api/orders/:id
 * 주문 상세 조회 (lookup_token 검증 필요)
 * - 토큰 없이는 접근 불가
 * - 주문번호 + 토큰 조합으로 본인 확인
 */
import { getSupabaseAdmin, dbError, sendError, handlePreflight } from '../_supabase.js'

export default async function handler(req, res) {
  if (handlePreflight(req, res, ['GET'])) return

  try {
    const orderId = Number(req.query.id)
    const token = req.query.token

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 주문번호입니다.' })
    }

    // 토큰 필수 검증
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(403).json({ error: '주문 조회 권한이 없습니다.' })
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(token.trim())) {
      return res.status(403).json({ error: '유효하지 않은 조회 토큰입니다.' })
    }

    // 주문 조회 (order_id + lookup_token 동시 검증)
    const { data: order, error: orderError } = await getSupabaseAdmin()
      .from('orders')
      .select('order_id, total_price, status, ordered_at')
      .eq('order_id', orderId)
      .eq('lookup_token', token.trim())
      .maybeSingle()

    if (orderError) throw dbError(orderError, '주문을 조회하지 못했습니다.')
    if (!order) {
      // 주문이 없거나 토큰 불일치 - 같은 메시지로 정보 노출 방지
      return res.status(404).json({ error: '주문을 찾을 수 없습니다.' })
    }

    // 주문 항목 조회
    const { data: items, error: itemsError } = await getSupabaseAdmin()
      .from('order_items')
      .select(`
        item_id,
        quantity,
        unit_price,
        menus (name)
      `)
      .eq('order_id', orderId)

    if (itemsError) throw dbError(itemsError, '주문 항목을 불러오지 못했습니다.')

    return res.status(200).json({
      order_id: order.order_id,
      total_price: order.total_price,
      status: order.status,
      ordered_at: order.ordered_at,
      items: (items || []).map(i => ({
        item_id: i.item_id,
        name: i.menus?.name || '알 수 없는 메뉴',
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    })
  } catch (err) {
    return sendError(res, err, '주문 조회')
  }
}
