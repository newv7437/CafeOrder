import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    '환경변수 VITE_SUPABASE_URL 또는 VITE_SUPABASE_PUBLISHABLE_KEY가 설정되지 않았습니다. ' +
    '.env.local 파일을 확인해 주세요.'
  )
}

// 클라이언트는 공개 publishable key만 사용합니다.
// service_role 키는 절대 여기에 사용하지 마세요.
export const supabase = createClient(supabaseUrl, supabasePublishableKey)
