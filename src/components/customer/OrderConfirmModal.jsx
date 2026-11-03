/**
 * 주문 확인 모달 컴포넌트
 * 주문 전 내용 확인 및 API 호출
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { apiFetch } from '../../lib/api'

// 조회 토큰을 세션 스토리지에 안전하게 저장
// lookup_token은 다른 사용자에게 노출되면 안 됩니다.
function saveOrderToken(orderId, lookupToken) {
  const key = `order_token_${orderId}`
  sessionStorage.setItem(key, lookupToken)
  // localStorage에도 저장하여 새로고침 후에도 조회 가능하게
  localStorage.setItem(key, lookupToken)
}

export default function OrderConfirmModal({ onClose }) {
  const { items, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleOrder() {
    if (submitting) return  // 중복 클릭 방지
    setSubmitting(true)
    setError(null)

    try {
      const payload = items.map(i => ({
        menu_id: i.menu_id,
        quantity: i.quantity,
        // 서버에서 가격을 DB에서 재조회하므로 클라이언트 가격은 참고용
      }))

      const data = await apiFetch('/api/orders', {
        method: 'POST',
        json: { items: payload },
      })

      if (!data?.order_id || !data?.lookup_token) {
        throw new Error('주문 결과가 올바르지 않습니다. 잠시 후 다시 시도해 주세요.')
      }

      // 조회 토큰 저장 (본인만 조회 가능)
      saveOrderToken(data.order_id, data.lookup_token)

      clearCart()
      navigate(`/order/${data.order_id}?token=${encodeURIComponent(data.lookup_token)}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
        <h2 id="confirm-modal-title" className="text-xl font-bold text-stone-800 mb-4">
          주문 확인
        </h2>

        {/* 주문 목록 */}
        <ul className="divide-y divide-stone-100 mb-4 max-h-60 overflow-y-auto">
          {items.map(item => (
            <li key={item.menu_id} className="flex justify-between py-2.5">
              <span className="text-stone-700">
                {item.name}
                <span className="text-stone-400 ml-1">× {item.quantity}</span>
              </span>
              <span className="font-medium text-stone-800">
                {(item.price * item.quantity).toLocaleString()}원
              </span>
            </li>
          ))}
        </ul>

        {/* 합계 */}
        <div className="bg-amber-50 rounded-xl px-4 py-3 flex justify-between items-center mb-4">
          <span className="font-semibold text-stone-700">총 결제금액</span>
          <span className="font-bold text-xl text-amber-700">{totalPrice.toLocaleString()}원</span>
        </div>

        {/* 오류 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleOrder}
            disabled={submitting}
            id="confirm-order-btn"
            className="flex-1 py-3 rounded-xl bg-amber-700 text-white font-bold hover:bg-amber-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                처리 중...
              </>
            ) : (
              '주문하기'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
