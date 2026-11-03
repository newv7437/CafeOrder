// place_cafe_order 실행 권한 확인 (존재하지 않는 메뉴 ID → 함수 내 검증 실패로 롤백, 데이터 생성 없음)
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = {}
for (const l of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const pub = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const args = { p_items: [{ menu_id: 999999, quantity: 1 }] }
const a = await admin.rpc('place_cafe_order', args)
console.log('[secret rpc]', a.status, JSON.stringify(a.error ?? a.data))
const b = await pub.rpc('place_cafe_order', args)
console.log('[publishable rpc]', b.status, JSON.stringify(b.error ?? b.data))
