/**
 * 인증 상태 관리 Context
 * Supabase Auth를 사용하는 관리자 인증 관리
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // 관리자 권한 확인 (서버에서 검증)
  async function checkAdminRole(accessToken) {
    if (!accessToken) {
      setIsAdmin(false)
      return
    }
    try {
      const data = await apiFetch('/api/admin/me', { token: accessToken })
      setIsAdmin(data?.isAdmin === true)
    } catch (err) {
      console.warn('관리자 권한 확인 실패:', err.message)
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    // 초기 세션 로드
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      await checkAdminRole(session?.access_token)
      setLoading(false)
    })

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        await checkAdminRole(session?.access_token)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setIsAdmin(false)
  }

  const value = {
    session,
    isAdmin,
    loading,
    signIn,
    signOut,
    accessToken: session?.access_token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
