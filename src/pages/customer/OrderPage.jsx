/**
 * 미니멀 프리미엄 주문 상세/상태 조회 페이지
 * Minimal Premium · 따뜻한 아이보리 + 에스프레소 브라운
 * 경로: /order/:orderId
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { apiFetch } from '../../lib/api'
import { getMenuImageUrl, DEFAULT_MENU_IMAGE } from '../../lib/menuImages'

const STATUS_STEPS = ['접수', '제조중', '완료']

function StatusBadge({ status }) {
  const styles = {
    '접수': 'bg-[#F0EBE1] text-[#4A2E1F] border-[#DFD3C3]',
    '제조중': 'bg-[#FFF8E7] text-[#B8860B] border-[#F2E0B5]',
    '완료': 'bg-[#EBF7EE] text-[#2E7D32] border-[#C8E6C9]',
    '취소': 'bg-[#FDECE9] text-[#C0392B] border-[#FADCD5]',
  }
  return (
    <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-serif font-bold border ${styles[status] || 'bg-white text-[#7A695C] border-[#E8E1D7]'}`}>
      {status}
    </span>
  )
}

function StatusProgress({ status }) {
  if (status === '취소') {
    return (
      <div className="bg-[#FFF5F2] border border-[#FADCD5] rounded-2xl px-5 py-4 text-center text-[#C0392B] font-medium text-xs">
        ✕ 주문이 취소되었습니다.
      </div>
    )
  }

  const currentIndex = STATUS_STEPS.indexOf(status)

  return (
    <div className="relative flex items-center justify-between px-4 py-2">
      {/* 연결선 */}
      <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#EFE8DE]" />
      <div
        className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-[#4A2E1F] transition-all duration-700"
        style={{ width: currentIndex === 0 ? '0%' : currentIndex === 1 ? '50%' : '100%' }}
      />

      {STATUS_STEPS.map((step, idx) => {
        const isDone = idx <= currentIndex
        const isCurrent = idx === currentIndex
        return (
          <div key={step} className="relative flex flex-col items-center gap-1.5 z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-serif font-bold text-xs border-2 transition-all duration-500 shadow-sm ${
              isDone
                ? 'bg-[#3D271D] border-[#3D271D] text-[#FAF7F2]'
                : 'bg-white border-[#DED4C7] text-[#B09E91]'
            } ${isCurrent ? 'ring-4 ring-[#EBDDCF] scale-110' : ''}`}>
              {isDone ? (isCurrent && step !== '완료' ? (
                <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
              ) : '✓') : idx + 1}
            </div>
            <span className={`text-[11px] font-medium font-serif ${isDone ? 'text-[#3D271D]' : 'text-[#A08E82]'}`}>
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

  const tokenFromUrl = searchParams.get('token')
  const tokenFromStorage = localStorage.getItem(`order_token_${orderId}`) || sessionStorage.getItem(`order_token_${orderId}`)
  const lookupToken = tokenFromUrl || tokenFromStorage

  const fetchOrder = useCallback(async () => {
    if (!lookupToken) {
      setError('주문 조회 권한이 없습니다. 주문 완료 링크를 사용해 주세요.')
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

  useEffect(() => {
    if (order?.status === '완료' || order?.status === '취소') return
    const timer = setInterval(fetchOrder, 5000)
    return () => clearInterval(timer)
  }, [order?.status, fetchOrder])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center">
        <LoadingSpinner size="lg" text="주문 정보를 확인하는 중입니다..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-[#EFEAE2]">
          <p className="text-4xl mb-3">☕</p>
          <h2 className="text-xl font-serif font-bold text-[#2B1810] mb-2">조회 실패</h2>
          <p className="text-xs text-[#7A695C] mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block bg-[#3D271D] text-[#FAF7F2] px-6 py-3 rounded-2xl text-xs font-semibold hover:bg-[#2B1810] transition-colors shadow-md"
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
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B1810]">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-[#EFEAE2]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" aria-label="메인으로" className="text-xs font-serif text-[#7C6A5E] hover:text-[#2B1810] flex items-center gap-1.5 transition-colors">
            <span>←</span>
            <span>Menu</span>
          </Link>
          <h1 className="font-serif font-bold text-base text-[#2B1810]">Order Status</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* 주문 완료 배너 */}
        {order.status === '접수' && (
          <div className="bg-[#3D271D] text-[#FAF7F2] rounded-3xl p-6 text-center shadow-lg border border-[#3D271D]">
            <p className="text-2xl mb-1.5">☕</p>
            <p className="font-serif font-black text-xl">주문이 접수되었습니다!</p>
            <p className="text-[#DFD3C3] text-xs mt-1">바리스타가 정성을 다해 준비하고 있습니다.</p>
          </div>
        )}
        {order.status === '제조중' && (
          <div className="bg-[#FFF8E7] text-[#4A2E1F] rounded-3xl p-6 text-center shadow-md border border-[#F2E0B5]">
            <p className="text-2xl mb-1.5">✨</p>
            <p className="font-serif font-black text-xl">맛있게 제조하고 있습니다!</p>
            <p className="text-[#8C7769] text-xs mt-1">잠시만 기다려 주시면 곧 완성됩니다.</p>
          </div>
        )}
        {order.status === '완료' && (
          <div className="bg-[#EBF7EE] text-[#1B5E20] rounded-3xl p-6 text-center shadow-md border border-[#C8E6C9]">
            <p className="text-2xl mb-1.5">🎉</p>
            <p className="font-serif font-black text-xl">주문이 준비되었습니다!</p>
            <p className="text-[#388E3C] text-xs mt-1">픽업대에서 음료를 수령해 주세요.</p>
          </div>
        )}

        {/* 주문 정보 카드 */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(61,39,29,0.05)] p-6 border border-[#EFEAE2]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] text-[#A08E82] uppercase tracking-wider">Order No.</p>
              <p className="font-serif text-3xl font-black text-[#2B1810]">#{order.order_id}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-[#8C7769]">주문 일시: {orderedAt}</p>
          {lastUpdated && (
            <p className="text-[11px] text-[#A08E82] mt-1">
              최종 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
              {order.status !== '완료' && order.status !== '취소' && ' (5초마다 자동 갱신)'}
            </p>
          )}
        </div>

        {/* 진행 상태 */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(61,39,29,0.05)] p-6 border border-[#EFEAE2]">
          <h2 className="font-serif font-bold text-sm text-[#2B1810] mb-4">주문 진행 현황</h2>
          <StatusProgress status={order.status} />
        </div>

        {/* 주문 내역 */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(61,39,29,0.05)] p-6 border border-[#EFEAE2]">
          <h2 className="font-serif font-bold text-sm text-[#2B1810] mb-4">주문 내역</h2>
          <ul className="divide-y divide-[#EFE8DE]">
            {(order.items || []).map(item => (
              <li key={item.item_id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] p-1 border border-[#EFE8DE] flex items-center justify-center overflow-hidden">
                    <img
                      src={getMenuImageUrl(item.name || item)}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.src = DEFAULT_MENU_IMAGE }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-xs text-[#2B1810]">{item.name}</p>
                    <p className="text-[11px] text-[#8C7769]">{item.unit_price.toLocaleString()}원 × {item.quantity}</p>
                  </div>
                </div>
                <p className="font-serif font-bold text-sm text-[#3D271D]">
                  {(item.unit_price * item.quantity).toLocaleString()}원
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#F2ECE4] pt-4 mt-2 flex justify-between items-baseline">
            <span className="font-serif font-bold text-sm text-[#2B1810]">총 결제금액</span>
            <span className="font-serif font-black text-2xl text-[#3D271D]">
              {order.total_price.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 메뉴로 돌아가기 버튼 */}
        <div className="text-center pt-2 pb-8">
          <Link
            to="/"
            className="cursor-pointer inline-flex items-center justify-center gap-2 bg-[#3D271D] text-[#FAF7F2] px-8 py-3.5 rounded-2xl font-serif font-bold text-sm hover:bg-[#2B1810] transition-all shadow-lg active:scale-95"
          >
            <span>메뉴로 돌아가기</span>
            <span>→</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
