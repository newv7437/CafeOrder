/**
 * 관리자 대시보드 - 주문 관리
 * 경로: /admin (인증 후)
 */
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

const STATUS_OPTIONS = ['전체', '접수', '제조중', '완료', '취소']

const STATUS_STYLE = {
  '접수': 'bg-blue-100 text-blue-700 border-blue-200',
  '제조중': 'bg-amber-100 text-amber-700 border-amber-200',
  '완료': 'bg-green-100 text-green-700 border-green-200',
  '취소': 'bg-red-100 text-red-600 border-red-200',
}

const NEXT_STATUS = { '접수': '제조중', '제조중': '완료' }

function OrderRow({ order, onStatusChange }) {
  const [updating, setUpdating] = useState(false)
  const { accessToken } = useAuth()

  async function changeStatus(newStatus) {
    const action = newStatus === '취소' ? '취소' : `'${newStatus}'으로 변경`
    if (!window.confirm(`주문 #${order.order_id}을 ${action}하시겠습니까?`)) return

    setUpdating(true)
    try {
      await apiFetch(`/api/admin/orders/${order.order_id}`, {
        method: 'PATCH',
        token: accessToken,
        json: { status: newStatus },
      })
      onStatusChange(order.order_id, newStatus)
    } catch (err) {
      alert(`오류: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const nextStatus = NEXT_STATUS[order.status]
  const canCancel = order.status === '접수' || order.status === '제조중'

  const orderedAt = new Date(order.ordered_at).toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })

  return (
    <tr className="border-b border-stone-100 hover:bg-amber-50/50 transition-colors">
      <td className="px-4 py-3 font-bold text-stone-800">#{order.order_id}</td>
      <td className="px-4 py-3 text-stone-500 text-sm">{orderedAt}</td>
      <td className="px-4 py-3">
        <ul className="text-sm text-stone-700 space-y-0.5">
          {(order.items || []).map(item => (
            <li key={item.item_id}>
              {item.name} <span className="text-stone-400">× {item.quantity}</span>
            </li>
          ))}
        </ul>
      </td>
      <td className="px-4 py-3 font-semibold text-stone-800 text-right">
        {order.total_price.toLocaleString()}원
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[order.status] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
          {order.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5 flex-wrap">
          {nextStatus && (
            <button
              onClick={() => changeStatus(nextStatus)}
              disabled={updating}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {updating ? '처리 중...' : `→ ${nextStatus}`}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => changeStatus('취소')}
              disabled={updating}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              취소
            </button>
          )}
          {!nextStatus && !canCancel && (
            <span className="text-stone-300 text-xs">-</span>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function AdminDashboard() {
  const { signOut, accessToken } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('전체')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeTab, setActiveTab] = useState('orders')

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await apiFetch('/api/admin/orders', { token: accessToken })
      setOrders(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 5초 자동 갱신
  useEffect(() => {
    const timer = setInterval(fetchOrders, 5000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  function handleStatusChange(orderId, newStatus) {
    setOrders(prev =>
      prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o)
    )
  }

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const filtered = filterStatus === '전체'
    ? orders
    : orders.filter(o => o.status === filterStatus)

  return (
    <div className="min-h-screen bg-stone-100">
      {/* 헤더 */}
      <header className="bg-stone-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">☕</span>
            <div>
              <h1 className="font-extrabold text-lg leading-none">CafeOrder</h1>
              <p className="text-stone-400 text-xs">관리자 대시보드</p>
            </div>
          </div>
          <button
            onClick={signOut}
            id="admin-logout-btn"
            className="text-stone-400 hover:text-white text-sm font-medium transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 탭 */}
      <div className="bg-stone-800 border-b border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0">
          {[
            { id: 'orders', label: '주문 관리', icon: '📋' },
            { id: 'menus', label: '메뉴 관리', icon: '🍽️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {activeTab === 'orders' ? (
          <OrdersPanel
            orders={orders}
            filtered={filtered}
            loading={loading}
            error={error}
            statusCounts={statusCounts}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            lastUpdated={lastUpdated}
            onRefresh={fetchOrders}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <MenusPanel accessToken={accessToken} />
        )}
      </main>
    </div>
  )
}

// ─── 주문 관리 패널 ───────────────────────────────────────────────────────────
function OrdersPanel({
  orders, filtered, loading, error, statusCounts,
  filterStatus, setFilterStatus, lastUpdated, onRefresh, onStatusChange
}) {
  return (
    <>
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['접수', '제조중', '완료', '취소'].map(status => {
          const count = statusCounts[status] || 0
          const colors = {
            '접수': 'from-blue-500 to-blue-600',
            '제조중': 'from-amber-500 to-amber-600',
            '완료': 'from-green-500 to-green-600',
            '취소': 'from-red-500 to-red-600',
          }
          return (
            <div key={status} className={`bg-gradient-to-br ${colors[status]} rounded-2xl p-4 text-white shadow-md`}>
              <p className="text-white/70 text-xs font-medium">{status}</p>
              <p className="text-3xl font-extrabold mt-1">{count}</p>
              <p className="text-white/60 text-xs">건</p>
            </div>
          )
        })}
      </div>

      {/* 필터 + 새로고침 */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                filterStatus === s
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
              }`}
            >
              {s}
              {s !== '전체' && statusCounts[s] ? (
                <span className="ml-1 bg-white/20 px-1 rounded">{statusCounts[s]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-stone-400 text-xs">
              {lastUpdated.toLocaleTimeString('ko-KR')} 갱신
            </span>
          )}
          <button
            onClick={onRefresh}
            id="refresh-orders-btn"
            className="bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* 오류 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* 주문 테이블 */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">{filterStatus === '전체' ? '주문이 없습니다.' : `${filterStatus} 상태의 주문이 없습니다.`}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="주문 목록">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-semibold text-stone-600">주문번호</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600">주문시간</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600">주문메뉴</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-600">금액</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600">상태</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-600">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <OrderRow key={order.order_id} order={order} onStatusChange={onStatusChange} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ─── 메뉴 관리 패널 ───────────────────────────────────────────────────────────
function MenusPanel({ accessToken }) {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchMenus() {
      try {
        const data = await apiFetch('/api/admin/menus', { token: accessToken })
        setMenus(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (accessToken) fetchMenus()
  }, [accessToken])

  function startEdit(menu) {
    setEditingId(menu.menu_id)
    setEditForm({
      price: menu.price,
      image_url: menu.image_url || '',
      is_available: menu.is_available,
    })
  }

  async function saveEdit(menuId) {
    setSaving(true)
    try {
      const data = await apiFetch(`/api/admin/menus/${menuId}`, {
        method: 'PATCH',
        token: accessToken,
        json: {
          price: Number(editForm.price),
          image_url: editForm.image_url || null,
          is_available: editForm.is_available,
        },
      })
      setMenus(prev => prev.map(m => m.menu_id === menuId ? { ...m, ...data } : m))
      setEditingId(null)
    } catch (err) {
      alert(`오류: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-amber-200 border-t-amber-700 rounded-full animate-spin" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <h2 className="font-bold text-stone-800">메뉴 목록</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="메뉴 목록">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="px-4 py-3 text-left font-semibold text-stone-600">메뉴명</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-600">카테고리</th>
              <th className="px-4 py-3 text-right font-semibold text-stone-600">가격</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-600">이미지 URL</th>
              <th className="px-4 py-3 text-center font-semibold text-stone-600">판매</th>
              <th className="px-4 py-3 text-center font-semibold text-stone-600">관리</th>
            </tr>
          </thead>
          <tbody>
            {menus.map(menu => (
              <tr key={menu.menu_id} className="border-b border-stone-100 hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-stone-800">{menu.name}</td>
                <td className="px-4 py-3 text-stone-500">{menu.category}</td>
                <td className="px-4 py-3 text-right">
                  {editingId === menu.menu_id ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                      className="w-24 border border-amber-300 rounded-lg px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ) : (
                    <span className="font-semibold">{menu.price.toLocaleString()}원</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === menu.menu_id ? (
                    <input
                      type="url"
                      value={editForm.image_url}
                      onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full max-w-xs border border-amber-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ) : (
                    <span className="text-stone-400 text-xs truncate max-w-xs inline-block">
                      {menu.image_url || '-'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === menu.menu_id ? (
                    <input
                      type="checkbox"
                      checked={editForm.is_available}
                      onChange={e => setEditForm(f => ({ ...f, is_available: e.target.checked }))}
                      className="w-4 h-4 accent-amber-600"
                    />
                  ) : (
                    <span className={`inline-block w-2 h-2 rounded-full ${menu.is_available ? 'bg-green-500' : 'bg-red-400'}`} />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === menu.menu_id ? (
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => saveEdit(menu.menu_id)}
                        disabled={saving}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {saving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(menu)}
                      className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      수정
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
