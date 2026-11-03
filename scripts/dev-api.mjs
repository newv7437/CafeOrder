/**
 * 로컬 API 개발 서버 (Vercel Node.js Serverless Functions 호환 실행기)
 *
 * 사용법:  npm run dev:api        (기본 포트 3000)
 *          npm run dev:all        (Vite + API 동시 실행)
 *
 * - api/ 폴더의 파일을 Vercel 과 같은 규칙으로 라우팅합니다.
 *     api/orders.js            → /api/orders
 *     api/orders/[id].js       → /api/orders/:id   (req.query.id)
 *     _ 로 시작하는 파일은 라우트가 아닙니다. (예: _supabase.js)
 * - Vercel 런타임 헬퍼를 동일하게 제공합니다: req.query, req.body, res.status(), res.json(), res.send()
 * - .env.local → .env 순서로 환경변수를 로드합니다. (이미 설정된 값은 덮어쓰지 않음, 값은 출력하지 않음)
 * - 핸들러가 예외를 던지거나 응답하지 않아도 항상 JSON 오류를 반환합니다.
 *
 * 실제 배포(Vercel)에는 사용되지 않는 개발 전용 스크립트입니다.
 * Vercel CLI 로그인/프로젝트 연결이 되어 있다면 `npm run dev:vercel` 로 공식 런타임을 사용할 수도 있습니다.
 */
import http from 'node:http'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = resolve(import.meta.dirname, '..')
const API_DIR = join(ROOT, 'api')
const PORT = Number(process.env.API_PORT || 3000)
const MAX_BODY = 1024 * 1024 // 1MB

// ─── 환경변수 로드 ────────────────────────────────────────────────
function loadEnvFile(file) {
  const path = join(ROOT, file)
  if (!existsSync(path)) return []
  const loaded = []
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    const [, key, raw] = m
    if (process.env[key] !== undefined) continue
    process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2')
    loaded.push(key)
  }
  return loaded
}
const loadedKeys = [...loadEnvFile('.env.local'), ...loadEnvFile('.env')]

// ─── 라우트 테이블 구성 ───────────────────────────────────────────
function collectRoutes(dir) {
  const routes = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      routes.push(...collectRoutes(full))
    } else if (name.endsWith('.js') && !name.startsWith('_')) {
      const rel = relative(API_DIR, full).split(sep).join('/').replace(/\.js$/, '').replace(/\/index$/, '')
      const segments = rel.split('/')
      const params = []
      const pattern = segments.map(seg => {
        const dyn = seg.match(/^\[(\w+)\]$/)
        if (dyn) { params.push(dyn[1]); return '([^/]+)' }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }).join('/')
      routes.push({ file: full, route: `/api/${rel}`, regex: new RegExp(`^/api/${pattern}/?$`), params, dynamic: params.length > 0 })
    }
  }
  // 정적 경로를 동적 경로보다 우선
  return routes.sort((a, b) => Number(a.dynamic) - Number(b.dynamic))
}

function matchRoute(pathname) {
  // 매 요청마다 다시 스캔 → 파일 추가/삭제도 재시작 없이 반영
  for (const r of collectRoutes(API_DIR)) {
    const m = pathname.match(r.regex)
    if (m) {
      const params = {}
      r.params.forEach((p, i) => { params[p] = decodeURIComponent(m[i + 1]) })
      return { ...r, params }
    }
  }
  return null
}

// ─── Vercel 호환 req/res 헬퍼 ────────────────────────────────────
function sendJson(res, status, payload) {
  if (res.writableEnded) return
  if (!res.headersSent) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }
  res.end(JSON.stringify(payload))
}

function enhanceResponse(res) {
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (obj) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(obj))
    return res
  }
  res.send = (body) => {
    if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) return res.json(body)
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(body)
    return res
  }
  return res
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) { reject(Object.assign(new Error('요청 크기가 너무 큽니다.'), { status: 413 })); req.destroy(); return }
      chunks.push(c)
    })
    req.on('end', () => resolveBody(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function parseBody(raw, contentType = '') {
  if (raw.length === 0) return undefined
  const text = raw.toString('utf8')
  if (contentType.includes('application/json')) {
    try { return JSON.parse(text) } catch {
      throw Object.assign(new Error('요청 본문이 올바른 JSON 형식이 아닙니다.'), { status: 400 })
    }
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(text))
  }
  return text
}

// ─── 서버 ─────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const started = Date.now()
  enhanceResponse(res)
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  res.on('finish', () => {
    console.log(`${req.method} ${url.pathname} → ${res.statusCode} (${Date.now() - started}ms)`)
  })

  if (!url.pathname.startsWith('/api/')) {
    return sendJson(res, 404, { error: '이 서버는 /api/* 요청만 처리합니다. 프론트엔드는 Vite(5173)에서 실행하세요.' })
  }

  const match = matchRoute(url.pathname)
  if (!match) {
    return sendJson(res, 404, { error: `API 경로를 찾을 수 없습니다: ${url.pathname}`, code: 'NOT_FOUND' })
  }

  try {
    const raw = await readBody(req)
    req.body = parseBody(raw, req.headers['content-type'])
    req.query = { ...Object.fromEntries(url.searchParams), ...match.params }
    req.cookies = Object.fromEntries(
      (req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(([k]) => k)
    )

    // 핸들러 파일 수정 시 재시작 없이 반영 (mtime 기반 캐시 무효화)
    const mod = await import(`${pathToFileURL(match.file).href}?t=${statSync(match.file).mtimeMs}`)
    const handler = mod.default
    if (typeof handler !== 'function') {
      throw new Error(`${match.route}: default export 핸들러 함수가 없습니다.`)
    }

    await handler(req, res)

    if (!res.writableEnded) {
      console.error(`[dev-api] ${match.route}: 핸들러가 응답을 종료하지 않았습니다.`)
      sendJson(res, 500, { error: '서버 함수가 응답을 반환하지 않았습니다.', code: 'NO_RESPONSE' })
    }
  } catch (err) {
    console.error(`[dev-api] ${match.route} 처리 중 예외:`, err)
    sendJson(res, err.status || 500, {
      error: err.status ? err.message : '서버 함수 실행 중 오류가 발생했습니다.',
      code: err.status ? 'BAD_REQUEST' : 'FUNCTION_CRASHED',
      detail: String(err?.message || err),
    })
  }
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 포트 ${PORT} 가 이미 사용 중입니다. 다른 프로세스를 종료하거나 API_PORT 환경변수로 포트를 변경하세요.`)
    process.exit(1)
  }
  throw err
})

server.listen(PORT, () => {
  const mask = (k) => (process.env[k] ? '✅ 설정됨' : '❌ 없음')
  console.log(`\n🚀 로컬 API 서버 실행: http://localhost:${PORT}/api`)
  console.log(`   환경변수 로드: ${loadedKeys.length}개 (.env.local/.env)`)
  console.log(`   SUPABASE_URL ${mask('SUPABASE_URL')} | SUPABASE_SERVICE_ROLE_KEY ${mask('SUPABASE_SERVICE_ROLE_KEY')} | ADMIN_USER_IDS ${mask('ADMIN_USER_IDS')}`)
  console.log('   라우트:')
  for (const r of collectRoutes(API_DIR)) console.log(`     ${r.route}`)
  console.log('')
})
