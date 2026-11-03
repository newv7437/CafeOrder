/**
 * 장바구니 사이드 패널 컴포넌트
 */
import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import OrderConfirmModal from './OrderConfirmModal'

export default function CartPanel() {
  const { items, totalQuantity, totalPrice, increment, decrement, removeItem, error, clearError } = useCart()
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <aside
        className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-4 sticky top-4"
        aria-label="장바구니"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">
            🛒 장바구니
            {totalQuantity > 0 && (
              <span className="ml-2 bg-amber-700 text-white text-xs rounded-full px-2 py-0.5">
                {totalQuantity}
              </span>
            )}
          </h2>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} aria-label="오류 닫기" className="ml-2 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* 빈 장바구니 */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-stone-400">
            <span className="text-5xl mb-3">🧺</span>
            <p className="text-sm">장바구니가 비어있어요</p>
            <p className="text-xs mt-1">메뉴를 선택해 주세요</p>
          </div>
        ) : (
          <>
            {/* 아이템 목록 */}
            <ul className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
              {items.map(item => (
                <li key={item.menu_id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                    <p className="text-xs text-amber-700">{(item.price * item.quantity).toLocaleString()}원</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => decrement(item.menu_id)}
                      aria-label={`${item.name} 수량 감소`}
                      className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-sm transition-colors flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-stone-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increment(item.menu_id)}
                      aria-label={`${item.name} 수량 증가`}
                      className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-sm transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.menu_id)}
                      aria-label={`${item.name} 제거`}
                      className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 text-sm transition-colors flex items-center justify-center ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* 합계 */}
            <div className="border-t border-stone-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">총 {totalQuantity}개</span>
                <span className="font-bold text-lg text-stone-800">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 주문 버튼 */}
            <button
              onClick={() => setShowConfirm(true)}
              id="order-submit-btn"
              className="w-full bg-amber-700 hover:bg-amber-800 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all duration-150 text-base shadow-md"
            >
              주문하기
            </button>
          </>
        )}
      </aside>

      {showConfirm && (
        <OrderConfirmModal onClose={() => setShowConfirm(false)} />
      )}
    </>
  )
}
