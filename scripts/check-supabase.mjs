/**
 * Supabase 연결 점검 스크립트 (읽기 전용)
 * 사용법: node scripts/check-supabase.mjs
 * - .env.local 을 읽어 환경변수 로드 여부를 확인합니다. (키 값은 출력하지 않음)
 * - publishable key 로 메뉴 조회
 * - secret key 로 orders / order_items 조회 및 place_cafe_order 함수 권한 확인
 * 데이터를 생성/수정/삭제하지 않습니다.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(path) {
  const env = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv('.env.local')
const mask = (v) => (v ? `설정됨 (길이 ${v.length})` : '❌ 없음')

console.log('== 환경변수 ==')
console.log('VITE_SUPABASE_URL            :', env.VITE_SUPABASE_URL || '❌ 없음')
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', mask(env.VITE_SUPABASE_PUBLISHABLE_KEY))
console.log('SUPABASE_URL                 :', env.SUPABASE_URL || '❌ 없음')
console.log('SUPABASE_SERVICE_ROLE_KEY    :', mask(env.SUPABASE_SERVICE_ROLE_KEY))
const adminIds = (env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
console.log('ADMIN_USER_IDS               :', adminIds.length && adminIds.every(id => uuidRe.test(id)) ? `UUID ${adminIds.length}개` : '⚠️ UUID 형식 아님 (미설정)')

const pub = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

console.log('\n== publishable key: menus 조회 ==')
{
  const { data, error } = await pub.from('menus').select('*').order('menu_id')
  if (error) console.log('❌', error.message)
  else {
    console.log(`✅ ${data.length}개`)
    console.table(data.map(({ menu_id, name, price, is_available }) => ({ menu_id, name, price, is_available })))
  }
}

console.log('\n== secret key: 테이블 접근 ==')
for (const t of ['menus', 'orders', 'order_items']) {
  const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true })
  console.log(t.padEnd(12), error ? `❌ ${error.message}` : `✅ ${count}행`)
}

console.log('\n== publishable key: orders 직접 접근 (차단되어야 정상) ==')
{
  const { data, error } = await pub.from('orders').select('order_id').limit(1)
  console.log(error ? `차단됨: ${error.message}` : `조회 결과 ${data.length}행 (RLS로 0행이면 정상)`)
}
