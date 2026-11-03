/**
 * 앱 루트 - 라우팅 설정
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

import MenuPage from './pages/customer/MenuPage'
import OrderPage from './pages/customer/OrderPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRoute from './components/common/AdminRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

// 로그인된 상태에서 /admin/login 접근 시 대시보드로 이동
function AdminLoginRedirect() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (session && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <AdminLogin />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* 고객 화면 */}
            <Route path="/" element={<MenuPage />} />
            <Route path="/order/:orderId" element={<OrderPage />} />

            {/* 관리자 화면 */}
            <Route path="/admin/login" element={<AdminLoginRedirect />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* 기타 경로 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
