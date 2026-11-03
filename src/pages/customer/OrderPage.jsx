/**
 * 주문 상세/상태 조회 페이지
 * 경로: /order/:orderId
 * lookup_token 검증 필요
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { apiFetch } from '../../lib/api'

const STATUS_STEPS = ['접수', '제조중', '완료']

function StatusBadge({ status }) {
  const styles = {
    '접수': 'bg-blue-100 text-blue-700 border-blue-200',
    '제조중': 'bg-amber-100 text-amber-700 border-amber-200',
    '완료': 'bg-green-100 text-green-700 border-green-200',
    '취소': 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${styles[status] || 'bg-stone-100 text-stone-700 border-stone-200'}`}>
      {status}
    </span>
  )
}

function StatusProgress({ status }) {
  if (status === '취소') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center text-red-600 font-medium">
        ❌ 주문이 취소되었습니다.
      </div>
    )
  }

  const currentIndex = STATUS_STEPS.indexOf(status)

  return (
    <div className="relative flex items-center justify-between px-2">
      {/* 연결선 */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-stone-200 mx-8" />
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-500 mx-8 transition-all duration-700"
        style={{ width: currentIndex === 0 ? '0%' : currentIndex === 1 ? '50%' : '100%' }}
      />

      {STATUS_STEPS.map((step, idx) => {
        const isDone = idx <= currentIndex
        const isCurrent = idx === currentIndex
        return (
          <div key={step} className="relative flex flex-col items-center gap-1 z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-500 ${
              isDone
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white border-stone-300 text-stone-400'
            } ${isCurrent ? 'ring-4 ring-amber-200 scale-110' : ''}`}>
              {isDone ? (isCurrent && step !== '완료' ? (
                <span className="w-3 h-3 bg-white rounded-full animate-ping" />
              ) : '✓') : idx + 1}
            </div>
            <span className={`text-xs font-medium ${isDone ? 'text-amber-700' : 'text-stone-400'}`}>
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function OrderPage() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // lookup_token: URL 파라미터 또는 로컬 스토리지에서
  const tokenFromUrl = searchParams.get('token')
  const tokenFromStorage = localStorage.getItem(`order_token_${orderId}`) || sessionStorage.getItem(`order_token_${orderId}`)
  const lookupToken = tokenFromUrl || tokenFromStorage

  const fetchOrder = useCallback(async () => {
    if (!lookupToken) {
      setError('주문 조회 권한이 없습니다. 주문 완료 후 표시되는 링크를 사용해 주세요.')
      setLoading(false)
      return
    }

    try {
      const data = await apiFetch(
        `/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(lookupToken)}`
      )

      setOrder(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [orderId, lookupToken])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // 5초 자동 갱신 (완료/취소 제외)
  useEffect(() => {
    if (order?.status === '완료' || order?.status === '취소') return

    const timer = setInterval(fetchOrder, 5000)
    return () => clearInterval(timer)
  }, [order?.status, fetchOrder])

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="주문 정보를 불러오는 중..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-stone-800 mb-2">조회 실패</h2>
          <p className="text-stone-500 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-800 transition-colors"
          >
            메뉴로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const orderedAt = order.ordered_at
    ? new Date(order.ordered_at).toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    : '-'

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-800 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" aria-label="메인으로" className="text-amber-200 hover:text-white">
            ← 메뉴
          </Link>
          <h1 className="text-lg font-bold">주문 상세</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 주문 완료 배너 */}
        {order.status === '접수' && (
          <div className="bg-blue-600 text-white rounded-2xl p-5 text-center shadow-md">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-lg font-bold">주문이 접수되었습니다!</p>
            <p className="text-blue-100 text-sm mt-1">잠시만 기다려 주세요</p>
          </div>
        )}
        {order.status === '완료' && (
          <div className="bg-green-600 text-white rounded-2xl p-5 text-center shadow-md">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-lg font-bold">주문이 완료되었습니다!</p>
            <p className="text-green-100 text-sm mt-1">맛있게 드세요 😊</p>
          </div>
        )}

        {/* 주문 정보 */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-stone-400 text-xs">주문번호</p>
              <p className="text-2xl font-extrabold text-stone-800">#{order.order_id}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-stone-400 text-xs">주문 시간: {orderedAt}</p>
          {lastUpdated && (
            <p className="text-stone-300 text-xs mt-1">
              최종 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
              {order.status !== '완료' && order.status !== '취소' && ' (5초마다 자동 갱신)'}
            </p>
          )}
        </div>

        {/* 진행 상태 */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="font-bold text-stone-800 mb-5">주문 진행 상황</h2>
          <StatusProgress status={order.status} />
        </div>

        {/* 주문 항목 */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="font-bold text-stone-800 mb-3">주문 내역</h2>
          <ul className="divide-y divide-stone-100">
            {(order.items || []).map(item => (
              <li key={item.item_id} className="flex justify-between py-3">
                <div>
                  <p className="font-medium text-stone-800">{item.name}</p>
                  <p className="text-stone-400 text-xs">{item.unit_price.toLocaleString()}원 × {item.quantity}</p>
                </div>
                <p className="font-semibold text-stone-800">
                  {(item.unit_price * item.quantity).toLocaleString()}원
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t-2 border-stone-100 pt-3 flex justify-between">
            <span className="font-bold text-stone-700">합계</span>
            <span className="font-extrabold text-xl text-amber-700">
              {order.total_price.toLocaleString()}원
            </span>
          </div>
        </div>

        <div className="text-center pb-6">
          <Link
            to="/"
            className="inline-block bg-amber-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-amber-800 transition-colors shadow-md"
          >
            메뉴로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  )
}
