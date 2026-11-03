/**
 * GET /api/admin/menus
 * 관리자 메뉴 전체 조회 (판매 중지 포함)
 */
import {
  getSupabaseAdmin, verifyToken, checkAdmin, getBearerToken,
  dbError, sendError, handlePreflight,
} from '../_supabase.js'

export default async function handler(req, res) {
  if (handlePreflight(req, res, ['GET'])) return

  try {
    const user = await verifyToken(getBearerToken(req))
    checkAdmin(user.id)

    const { data, error } = await getSupabaseAdmin()
      .from('menus')
      .select('*')
      .order('category')
      .order('name')

    if (error) throw dbError(error, '메뉴를 불러오지 못했습니다.')

    return res.status(200).json(data || [])
  } catch (err) {
    return sendError(res, err, '관리자 메뉴 조회')
  }
}
