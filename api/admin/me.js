/**
 * GET /api/admin/me
 * 로그인 사용자의 관리자 권한 확인
 * AuthContext에서 호출하여 isAdmin 상태를 결정
 */
import { verifyToken, checkAdmin, getBearerToken, sendError, handlePreflight, HttpError } from '../_supabase.js'

export default async function handler(req, res) {
  if (handlePreflight(req, res, ['GET'])) return

  try {
    const user = await verifyToken(getBearerToken(req))

    try {
      checkAdmin(user.id)
      return res.status(200).json({ isAdmin: true, userId: user.id })
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        return res.status(200).json({ isAdmin: false })
      }
      throw err
    }
  } catch (err) {
    return sendError(res, err, '관리자 확인')
  }
}
