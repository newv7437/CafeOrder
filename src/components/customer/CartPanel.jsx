/**
 * 미니멀 프리미엄 장바구니 패널
 * Minimal Premium · 따뜻한 아이보리 + 에스프레소 브라운
 */
import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { getMenuImageUrl, DEFAULT_MENU_IMAGE } from '../../lib/menuImages'
import OrderConfirmModal from './OrderConfirmModal'

export default function CartPanel() {
  const { items, totalQuantity, totalPrice, increment, decrement, removeItem, error, clearError } = useCart()
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <aside
        className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_30px_rgba(61,39,29,0.08)] border border-[#EFEAE2] flex flex-col gap-5 sticky top-24 transition-all duration-300"
        aria-label="장바구니"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[#F2ECE4] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧺</span>
            <h2 className="font-serif font-bold text-lg text-[#2B1810]">
              Cart
            </h2>
          </div>
          {totalQuantity > 0 && (
            <span className="bg-[#4A2E1F] text-[#FAF7F2] text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              {totalQuantity}개 선택
            </span>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-[#FFF5F2] border border-[#FADCD5] text-[#C0392B] text-xs rounded-2xl px-3.5 py-2.5 flex items-center justify-between animate-fade-in">
            <span>{error}</span>
            <button onClick={clearError} aria-label="오류 닫기" className="text-[#C0392B] hover:opacity-75">✕</button>
          </div>
        )}

        {/* 장바구니 목록 */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center text-2xl mb-3 text-[#A08E82] shadow-inner">
              ☕
            </div>
            <p className="font-serif font-medium text-sm text-[#4A2E1F]">장바구니가 비어 있습니다</p>
            <p className="text-xs text-[#9B897D] mt-1 font-sans">원하시는 프리미엄 메뉴를 담아보세요</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3.5 max-h-[340px] overflow-y-auto pr-1">
              {items.map(item => (
                <li
                  key={item.menu_id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DE] transition-all hover:bg-[#F5EFE6]"
                >
                  {/* 작은 3D 썸네일 */}
                  <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                    <img
                      src={getMenuImageUrl(item.name || item)}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.src = DEFAULT_MENU_IMAGE }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-[#2B1810] truncate">{item.name}</p>
                    <p className="font-serif font-semibold text-xs text-[#4A2E1F] mt-0.5">
                      {(item.price * item.quantity).toLocaleString()}원
                    </p>
                  </div>

                  {/* 수량 조절 버튼 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => decrement(item.menu_id)}
                      aria-label={`${item.name} 수량 감소`}
                      className="cursor-pointer w-6 h-6 rounded-lg bg-white border border-[#E5DDD2] hover:bg-[#EBDDCF] text-[#3D271D] font-bold text-xs flex items-center justify-center transition-colors active:scale-95"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-[#2B1810]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increment(item.menu_id)}
                      aria-label={`${item.name} 수량 증가`}
                      className="cursor-pointer w-6 h-6 rounded-lg bg-white border border-[#E5DDD2] hover:bg-[#EBDDCF] text-[#3D271D] font-bold text-xs flex items-center justify-center transition-colors active:scale-95"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.menu_id)}
                      aria-label={`${item.name} 제거`}
                      className="cursor-pointer w-6 h-6 rounded-lg text-[#B09E91] hover:text-[#C0392B] hover:bg-[#FDECE9] text-xs flex items-center justify-center transition-colors ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* 결제 정보 */}
            <div className="border-t border-[#F2ECE4] pt-4 mt-1 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-[#8C7769]">
                <span>총 주문 수량</span>
                <span className="font-semibold text-[#4A2E1F]">{totalQuantity}개</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-serif font-bold text-sm text-[#2B1810]">총 결제금액</span>
                <span className="font-serif font-black text-2xl text-[#3D271D]">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 커다란 포인트 컬러 주문 버튼 */}
            <button
              onClick={() => setShowConfirm(true)}
              id="order-submit-btn"
              className="cursor-pointer w-full bg-[#3D271D] hover:bg-[#2B1810] active:scale-[0.98] text-[#FAF7F2] font-serif font-bold py-4 rounded-2xl transition-all duration-200 text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              <span>주문하기</span>
              <span className="text-sm opacity-70 group-hover:translate-x-1 transition-transform">→</span>
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
