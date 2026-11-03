// 상세 진단 (읽기 전용) - 키 값은 출력하지 않음
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = {}
for (const l of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const k = env.SUPABASE_SERVICE_ROLE_KEY
console.log('secret key prefix ok:', k.startsWith('sb_secret_'), '| 공백/따옴표 포함:', /[\s"']/.test(k))
const pub = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const admin = createClient(env.SUPABASE_URL, k, { auth: { persistSession: false } })

const m = await pub.from('menus').select('*').limit(20)
console.log('\n[pub menus]', m.status, m.error?.message ?? `${m.data.length}행`)
if (m.data?.[0]) console.log('menus 컬럼:', Object.keys(m.data[0]).join(', '))
if (m.data) console.table(m.data)

for (const t of ['menus', 'orders', 'order_items']) {
  const r = await admin.from(t).select('*').limit(2)
  console.log(`\n[secret ${t}]`, r.status, r.error ? JSON.stringify(r.error) : `${r.data.length}행`)
  if (r.data?.[0]) console.log('컬럼:', Object.keys(r.data[0]).join(', '))
}
