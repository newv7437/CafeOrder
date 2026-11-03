/**
 * 관리자 전용 라우트 가드
 * 인증 및 관리자 권한 확인
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

export default function AdminRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="권한 확인 중..." />
      </div>
    )
  }

  // 미로그인
  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  // 로그인했지만 관리자 아님
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
        <div className="text-center text-white">
          <p className="text-5xl mb-4">🚫</p>
          <h2 className="text-xl font-bold mb-2">접근 권한 없음</h2>
          <p className="text-stone-400 mb-6">관리자 계정이 아닙니다.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
          >
            메인으로
          </button>
        </div>
      </div>
    )
  }

  return children
}
