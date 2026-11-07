/**
 * 미니멀 프리미엄 주문 확인 모달 컴포넌트
 * Minimal Premium · 따뜻한 아이보리 + 에스프레소 브라운
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { apiFetch } from '../../lib/api'
import { getMenuImageUrl, DEFAULT_MENU_IMAGE } from '../../lib/menuImages'

function saveOrderToken(orderId, lookupToken) {
  const key = `order_token_${orderId}`
  sessionStorage.setItem(key, lookupToken)
  localStorage.setItem(key, lookupToken)
}

export default function OrderConfirmModal({ onClose }) {
  const { items, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleOrder() {
    if (submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const payload = items.map(i => ({
        menu_id: i.menu_id,
        quantity: i.quantity,
      }))

      const data = await apiFetch('/api/orders', {
        method: 'POST',
        json: { items: payload },
      })

      if (!data?.order_id || !data?.lookup_token) {
        throw new Error('주문 결과가 올바르지 않습니다. 잠시 후 다시 시도해 주세요.')
      }

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
      className="fixed inset-0 bg-[#2B1810]/50 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-[#FBF9F5] rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7 animate-slide-up border border-[#EFEAE2]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-[#8C7769] font-semibold block">
              Order Confirmation
            </span>
            <h2 id="confirm-modal-title" className="font-serif font-black text-2xl text-[#2B1810]">
              주문 확인
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-white text-[#8C7769] hover:text-[#2B1810] flex items-center justify-center shadow-sm text-sm border border-[#EFE8DE]"
          >
            ✕
          </button>
        </div>

        {/* 주문 목록 */}
        <ul className="divide-y divide-[#EFE8DE] mb-5 max-h-64 overflow-y-auto pr-1">
          {items.map(item => (
            <li key={item.menu_id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 border border-[#EFE8DE] flex items-center justify-center overflow-hidden">
                  <img
                    src={getMenuImageUrl(item.name || item)}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = DEFAULT_MENU_IMAGE }}
                  />
                </div>
                <div>
                  <p className="font-medium text-xs text-[#2B1810]">{item.name}</p>
                  <p className="text-[11px] text-[#8C7769]">{item.price.toLocaleString()}원 × {item.quantity}</p>
                </div>
              </div>
              <span className="font-serif font-bold text-sm text-[#3D271D]">
                {(item.price * item.quantity).toLocaleString()}원
              </span>
            </li>
          ))}
        </ul>

        {/* 합계 박스 */}
        <div className="bg-white rounded-2xl p-4 flex justify-between items-center mb-5 border border-[#EFEAE2] shadow-sm">
          <div>
            <span className="text-xs text-[#8C7769] block">총 결제금액</span>
            <span className="text-[11px] text-[#A08E82]">{items.reduce((s, i) => s + i.quantity, 0)}개 메뉴</span>
          </div>
          <span className="font-serif font-black text-2xl text-[#3D271D]">
            {totalPrice.toLocaleString()}원
          </span>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-[#FFF5F2] border border-[#FADCD5] text-[#C0392B] text-xs rounded-2xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer flex-1 py-3.5 rounded-2xl border border-[#DED4C7] bg-white text-[#7C6A5E] font-medium text-sm hover:bg-[#F3ECE0] transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleOrder}
            disabled={submitting}
            id="confirm-order-btn"
            className="cursor-pointer flex-1 py-3.5 rounded-2xl bg-[#3D271D] text-[#FAF7F2] font-serif font-bold text-sm hover:bg-[#2B1810] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                접수 중...
              </>
            ) : (
              '주문 완료하기'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
