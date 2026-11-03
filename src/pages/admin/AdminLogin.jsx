/**
 * 관리자 로그인 페이지
 * 경로: /admin (미인증 시)
 */
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      // AuthContext에서 관리자 확인 후 AdminDashboard로 자동 이동
    } catch (err) {
      // 오류 메시지를 한국어로 변환
      if (err.message.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else if (err.message.includes('Email not confirmed')) {
        setError('이메일 인증이 필요합니다. 메일함을 확인해 주세요.')
      } else {
        setError('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <span className="text-5xl">☕</span>
          <h1 className="text-2xl font-extrabold text-white mt-3">CafeOrder</h1>
          <p className="text-stone-400 text-sm mt-1">관리자 로그인</p>
        </div>

        {/* 폼 */}
        <form
          onSubmit={handleSubmit}
          className="bg-stone-800 rounded-2xl p-6 shadow-2xl space-y-4"
          aria-label="관리자 로그인 폼"
        >
          <div>
            <label htmlFor="admin-email" className="block text-stone-300 text-sm font-medium mb-1.5">
              이메일
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="w-full bg-stone-700 text-white placeholder-stone-500 border border-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-stone-300 text-sm font-medium mb-1.5">
              비밀번호
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-stone-700 text-white placeholder-stone-500 border border-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div
              role="alert"
              className="bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            id="admin-login-btn"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>

          <p className="text-stone-500 text-xs text-center pt-1">
            회원가입은 관리자에게 문의하세요.
          </p>
        </form>
      </div>
    </div>
  )
}
