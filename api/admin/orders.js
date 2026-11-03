/**
 * GET /api/admin/orders
 * 관리자 전체 주문 목록 조회
 * - Bearer 토큰 검증 필수
 * - 관리자 허용 목록 확인 필수
 *
 * 주의: package.json 이 "type":"module" 이므로 require/module.exports(CommonJS)를
 * 사용하면 함수가 로드 시점에 크래시합니다. 반드시 ESM(import/export) 사용.
 */
import {
  getSupabaseAdmin, verifyToken, checkAdmin, getBearerToken,
  dbError, sendError, handlePreflight,
} from '../_supabase.js'

export default async function handler(req, res) {
  if (handlePreflight(req, res, ['GET'])) return

  try {
    // 인증 검증
    const user = await verifyToken(getBearerToken(req))
    checkAdmin(user.id)

    // 주문 목록 조회 (최신순, 100건)
    const { data: orders, error: ordersError } = await getSupabaseAdmin()
      .from('orders')
      .select(`
        order_id,
        total_price,
        status,
        ordered_at,
        order_items (
          item_id,
          quantity,
          unit_price,
          menus (name)
        )
      `)
      .order('ordered_at', { ascending: false })
      .limit(100)

    if (ordersError) throw dbError(ordersError, '주문 목록을 불러오지 못했습니다.')

    const result = (orders || []).map(o => ({
      order_id: o.order_id,
      total_price: o.total_price,
      status: o.status,
      ordered_at: o.ordered_at,
      items: (o.order_items || []).map(i => ({
        item_id: i.item_id,
        name: i.menus?.name || '알 수 없는 메뉴',
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    }))

    return res.status(200).json(result)
  } catch (err) {
    return sendError(res, err, '관리자 주문 목록')
  }
}
