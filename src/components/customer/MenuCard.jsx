/**
 * 미니멀 프리미엄 카페 스타일 메뉴 카드
 * Minimal Premium · 따뜻한 아이보리 + 에스프레소 브라운
 */
import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { getMenuImageUrl, DEFAULT_MENU_IMAGE } from '../../lib/menuImages'
import { getMenuDetail } from '../../lib/menuDetails'

export default function MenuCard({ menu }) {
  const { addItem, items } = useCart()
  const [isAnimating, setIsAnimating] = useState(false)

  const cartItem = items.find(i => i.menu_id === menu.menu_id)
  const inCart = cartItem ? cartItem.quantity : 0
  const detail = getMenuDetail(menu.name)

  function handleAdd() {
    setIsAnimating(true)
    addItem(menu)
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <article className="group bg-white rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(61,39,29,0.05)] hover:shadow-[0_12px_32px_rgba(61,39,29,0.12)] border border-[#EFEAE2] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      {/* 상단 뱃지 & 평점 */}
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF5EE] text-[#4A2E1F] border border-[#E9DFD3]">
          ★ {detail.rating}
        </span>
        <span className="text-[11px] font-medium tracking-wider uppercase text-[#8C7769]">
          {detail.sub}
        </span>
      </div>

      {/* 커다란 3D 상품 이미지 영역 */}
      <div className="relative w-full aspect-square rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-[#F3ECE0] overflow-hidden flex items-center justify-center p-3 mb-4 group-hover:scale-[1.02] transition-transform duration-300">
        <img
          src={getMenuImageUrl(menu)}
          alt={menu.name}
          className="w-full h-full object-contain drop-shadow-md group-hover:drop-shadow-xl transition-all duration-300"
          onError={(e) => { e.target.src = DEFAULT_MENU_IMAGE }}
          loading="lazy"
        />

        {/* 담긴 수량 배지 */}
        {inCart > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-[#4A2E1F] text-[#FAF7F2] text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-scale-in">
            {inCart}
          </div>
        )}
      </div>

      {/* 메뉴 정보 */}
      <div className="flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="font-serif font-bold text-lg text-[#2B1810] leading-snug group-hover:text-[#4A2E1F] transition-colors">
            {menu.name}
          </h3>
          <p className="text-xs text-[#8C7769] font-sans tracking-wide">
            {detail.en}
          </p>
        </div>

        <p className="text-xs text-[#7A695C] line-clamp-2 leading-relaxed mb-4">
          {detail.desc}
        </p>

        {/* 가격 & 담기 버튼 */}
        <div className="mt-auto pt-3 border-t border-[#F2ECE4] flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-[#A08E82] uppercase tracking-wider block">Price</span>
            <span className="font-serif font-extrabold text-xl text-[#3D271D]">
              {menu.price.toLocaleString()}원
            </span>
          </div>

          <button
            onClick={handleAdd}
            id={`add-to-cart-${menu.menu_id}`}
            aria-label={`${menu.name} 장바구니에 담기`}
            className={`cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 select-none ${
              inCart > 0
                ? 'bg-[#3D271D] text-[#FAF7F2] hover:bg-[#2B1810] shadow-md'
                : 'bg-[#F5EFE6] text-[#4A2E1F] hover:bg-[#4A2E1F] hover:text-[#FAF7F2] hover:shadow-md'
            } ${isAnimating ? 'scale-90' : 'active:scale-95'}`}
          >
            {inCart > 0 ? (
              <>
                <span>+ 추가</span>
                <span className="opacity-80 font-normal">({inCart})</span>
              </>
            ) : (
              <>
                <span className="text-sm">+</span>
                <span>담기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
