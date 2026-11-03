/**
 * Supabase 서버 클라이언트 (service_role / secret key)
 * 절대 프론트엔드에 노출되면 안 됩니다.
 * Vercel 서버 환경변수에서만 읽습니다.
 *
 * ESM 방식 (package.json "type":"module" 호환)
 *
 * 변경 사항:
 * - 모듈 import 시점에 throw 하던 방식 → 요청 처리 시점에 지연 생성(getSupabaseAdmin)
 *   (import 시점 throw 는 함수 자체가 크래시되어 "빈 응답"을 만들고,
 *    프론트엔드에서 `Unexpected end of JSON input` 오류의 원인이 됩니다.)
 * - HttpError + sendError 로 모든 오류를 JSON + 올바른 HTTP 상태코드로 응답
 */
import { createClient } from '@supabase/supabase-js'

/** HTTP 상태코드를 가진 오류 */
export class HttpError extends Error {
  constructor(status, message, code = undefined, detail = undefined) {
    super(message)
    this.status = status
    this.code = code
    this.detail = detail
  }
}

const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'

let adminClient = null

/**
 * service_role 클라이언트 - RLS 우회 권한 있음
 * 절대 클라이언트에 반환하지 마세요
 */
export function getSupabaseAdmin() {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(
      500,
      '서버 환경변수(SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다.',
      'SERVER_CONFIG_MISSING'
    )
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}

/** Authorization: Bearer <token> 헤더에서 토큰 추출 */
export function getBearerToken(req) {
  const authHeader = req.headers?.authorization || ''
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
}

/**
 * Supabase Auth access token 검증
 * @param {string} token - Bearer 토큰
 * @returns {object} 사용자 정보
 */
export async function verifyToken(token) {
  if (!token) throw new HttpError(401, '인증 토큰이 없습니다.', 'AUTH_REQUIRED')

  const { data, error } = await getSupabaseAdmin().auth.getUser(token)
  if (error || !data?.user) {
    throw new HttpError(401, '유효하지 않은 인증 토큰입니다.', 'AUTH_INVALID')
  }
  return data.user
}

/**
 * 관리자 여부 확인
 * ADMIN_USER_IDS 환경변수에 등록된 UUID 목록과 비교
 * @param {string} userId - Supabase Auth user ID
 */
export function checkAdmin(userId) {
  const adminIds = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)

  if (!adminIds.includes(userId)) {
    throw new HttpError(403, '관리자 권한이 없습니다.', 'NOT_ADMIN')
  }
}

/**
 * 요청 본문(JSON) 파싱
 * Vercel 은 Content-Type: application/json 이면 req.body 를 객체로 파싱해 주지만,
 * 문자열/빈 값인 경우도 안전하게 처리합니다.
 */
export function parseJsonBody(req) {
  const body = req.body
  if (body == null || body === '') return {}
  if (typeof body === 'object' && !Buffer.isBuffer(body)) return body
  try {
    return JSON.parse(Buffer.isBuffer(body) ? body.toString('utf8') : body)
  } catch {
    throw new HttpError(400, '요청 본문이 올바른 JSON 형식이 아닙니다.', 'INVALID_JSON')
  }
}

/**
 * Supabase(PostgREST) 오류 → HttpError 변환
 * 원인을 숨기지 않도록 개발 환경에서는 detail 에 DB 메시지를 포함합니다.
 */
export function dbError(error, fallbackMessage = '데이터베이스 처리 중 오류가 발생했습니다.') {
  const detail = isProduction ? undefined : `${error.code || ''} ${error.message || ''}`.trim()

  // 42501: insufficient_privilege (GRANT 누락)
  if (error.code === '42501') {
    return new HttpError(500, '데이터베이스 권한이 부족합니다. (service_role GRANT 확인 필요)', 'DB_PERMISSION_DENIED', detail)
  }
  // PGRST202: 함수를 찾을 수 없음 / PGRST205: 테이블을 찾을 수 없음
  if (error.code === 'PGRST202' || error.code === 'PGRST205' || error.code === '42883' || error.code === '42P01') {
    return new HttpError(500, '데이터베이스 객체(함수/테이블)를 찾을 수 없습니다.', 'DB_OBJECT_NOT_FOUND', detail)
  }
  return new HttpError(500, fallbackMessage, 'DB_ERROR', detail)
}

/** 오류를 항상 JSON + 올바른 상태코드로 응답 */
export function sendError(res, err, context = 'API 오류') {
  if (err instanceof HttpError) {
    if (err.status >= 500) console.error(`[${context}]`, err.code, err.message, err.detail || '')
    const payload = { error: err.message }
    if (err.code) payload.code = err.code
    if (err.detail) payload.detail = err.detail
    return res.status(err.status).json(payload)
  }
  console.error(`[${context}]`, err)
  return res.status(500).json({
    error: '서버 오류가 발생했습니다.',
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { detail: String(err?.message || err) }),
  })
}

/** 공통 CORS 헤더 + OPTIONS/메서드 검사. 처리 완료 시 true 반환 */
export function handlePreflight(req, res, methods) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(', '))
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '))
    res.status(405).json({ error: '허용되지 않는 메서드입니다.', code: 'METHOD_NOT_ALLOWED' })
    return true
  }
  return false
}
