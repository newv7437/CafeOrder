/**
 * PATCH /api/admin/menus/:id
 * 관리자 메뉴 수정 (가격, 이미지, 판매 여부)
 */
import {
  getSupabaseAdmin, verifyToken, checkAdmin, getBearerToken,
  parseJsonBody, dbError, sendError, handlePreflight,
} from '../../_supabase.js'

export default async function handler(req, res) {
  if (handlePreflight(req, res, ['PATCH'])) return

  try {
    const user = await verifyToken(getBearerToken(req))
    checkAdmin(user.id)

    const menuId = Number(req.query.id)
    if (!Number.isInteger(menuId) || menuId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 메뉴 ID입니다.' })
    }

    const { price, image_url, is_available } = parseJsonBody(req)
    const updateData = {}

    if (price !== undefined) {
      const numPrice = Number(price)
      if (!Number.isInteger(numPrice) || numPrice < 0 || numPrice > 1000000) {
        return res.status(400).json({ error: '유효하지 않은 가격입니다. (0~1,000,000원)' })
      }
      updateData.price = numPrice
    }

    if (image_url !== undefined) {
      if (image_url !== null && typeof image_url !== 'string') {
        return res.status(400).json({ error: '이미지 URL 형식이 올바르지 않습니다.' })
      }
      // URL 길이 제한
      if (image_url && image_url.length > 2000) {
        return res.status(400).json({ error: '이미지 URL이 너무 깁니다.' })
      }
      updateData.image_url = image_url || null
    }

    if (is_available !== undefined) {
      if (typeof is_available !== 'boolean') {
        return res.status(400).json({ error: 'is_available는 true/false여야 합니다.' })
      }
      updateData.is_available = is_available
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '변경할 내용이 없습니다.' })
    }

    const { data, error } = await getSupabaseAdmin()
      .from('menus')
      .update(updateData)
      .eq('menu_id', menuId)
      .select()
      .maybeSingle()

    if (error) throw dbError(error, '메뉴 수정에 실패했습니다.')
    if (!data) {
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' })
    }

    return res.status(200).json(data)
  } catch (err) {
    return sendError(res, err, '메뉴 수정')
  }
}
