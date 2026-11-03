/**
 * 서버 API 호출 공통 헬퍼
 *
 * `res.json()` 을 바로 호출하면 응답 본문이 비어 있거나(HTML/텍스트 등) JSON 이 아닐 때
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input" 오류가 납니다.
 * 이 헬퍼는 본문을 텍스트로 먼저 읽고 안전하게 파싱하여, 원인을 알 수 있는 메시지로 변환합니다.
 */

export class ApiError extends Error {
  constructor(message, { status = 0, code, detail, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
    this.data = data
  }
}

/**
 * @param {string} url
 * @param {RequestInit & { json?: any, token?: string }} options
 *   - json: 전달 시 JSON.stringify + Content-Type 자동 설정
 *   - token: 전달 시 Authorization: Bearer 헤더 설정
 * @returns {Promise<any>} 파싱된 JSON 데이터
 */
export async function apiFetch(url, { json, token, headers, ...options } = {}) {
  const finalHeaders = { Accept: 'application/json', ...headers }
  if (json !== undefined) {
    finalHeaders['Content-Type'] = 'application/json'
    options.body = JSON.stringify(json)
  }
  if (token) finalHeaders.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, { ...options, headers: finalHeaders })
  } catch (networkErr) {
    throw new ApiError('서버에 연결할 수 없습니다. 네트워크 상태 또는 서버 실행 여부를 확인해 주세요.', {
      code: 'NETWORK_ERROR',
      detail: networkErr?.message,
    })
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  // 본문이 비었거나 JSON 이 아닌 경우
  if (data === null) {
    const kind = text ? 'JSON이 아닌 응답' : '빈 응답'
    console.error(`[apiFetch] ${options.method || 'GET'} ${url} → HTTP ${res.status} (${kind})`, text.slice(0, 300))
    if (res.ok && !text) return null // 204 No Content 등 정상 빈 응답
    throw new ApiError(
      res.status >= 500 || res.status === 404
        ? `서버 API가 올바른 응답을 반환하지 않았습니다. (HTTP ${res.status}, ${kind}) API 서버가 실행 중인지 확인해 주세요.`
        : `예상하지 못한 서버 응답입니다. (HTTP ${res.status}, ${kind})`,
      { status: res.status, code: 'INVALID_RESPONSE' }
    )
  }

  if (!res.ok) {
    if (data.detail) console.error(`[apiFetch] ${url} → HTTP ${res.status}`, data.code, data.detail)
    throw new ApiError(data.error || `요청 처리 중 오류가 발생했습니다. (HTTP ${res.status})`, {
      status: res.status,
      code: data.code,
      detail: data.detail,
      data,
    })
  }

  return data
}
