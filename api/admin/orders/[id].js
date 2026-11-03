/**
 * PATCH /api/admin/orders/:id
 * 관리자 주문 상태 변경
 * - Bearer 토큰 + 관리자 권한 검증
 * - 허용된 상태 전환만 가능
 * - 상태 변경 후 실제 DB에서 검증
 */
import {
  getSupabaseAdmin, verifyToken, checkAdmin, getBearerToken,
  parseJsonBody, dbError, sendError, handlePreflight,
} from '../../_supabase.js'

const ALLOWED_STATUSES = ['접수', '제조중', '완료', '취소']
const VALID_TRANSITIONS = {
  '접수': ['제조중', '취소'],
  '제조중': ['완료', '취소'],
  '완료': [],    // 완료 후 변경 불가
  '취소': [],    // 취소 후 변경 불가
}

export default async function handler(req, res) {
  if (handlePreflight(req, res, ['PATCH'])) return

  try {
    // 인증 검증
    const user = await verifyToken(getBearerToken(req))
    checkAdmin(user.id)

    const orderId = Number(req.query.id)
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 주문번호입니다.' })
    }

    const { status: newStatus } = parseJsonBody(req)
    if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
      return res.status(400).json({ error: `유효하지 않은 상태입니다. (허용: ${ALLOWED_STATUSES.join(', ')})` })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 현재 주문 조회
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('order_id, status')
      .eq('order_id', orderId)
      .maybeSingle()

    if (fetchError) throw dbError(fetchError, '주문을 조회하지 못했습니다.')
    if (!currentOrder) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다.' })
    }

    // 상태 전환 유효성 검사
    const allowedNext = VALID_TRANSITIONS[currentOrder.status] || []
    if (!allowedNext.includes(newStatus)) {
      return res.status(409).json({
        error: `'${currentOrder.status}' 상태에서 '${newStatus}'으로 변경할 수 없습니다.`,
        currentStatus: currentOrder.status,
      })
    }

    // 상태 업데이트 (동시 변경 방지: 조회한 현재 상태일 때만 갱신)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('order_id', orderId)
      .eq('status', currentOrder.status)
      .select('order_id, status')
      .maybeSingle()

    if (updateError) throw dbError(updateError, '상태 변경에 실패했습니다.')
    if (!updated) {
      return res.status(409).json({ error: '다른 곳에서 주문 상태가 먼저 변경되었습니다. 새로고침 후 다시 시도해 주세요.' })
    }

    return res.status(200).json(updated)
  } catch (err) {
    return sendError(res, err, '주문 상태 변경')
  }
}
