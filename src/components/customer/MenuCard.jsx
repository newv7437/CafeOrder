/**
 * 미니멀 프리미엄 메뉴 카드
 * 군더더기 배지 제거 및 첫 화면에 쏙 들어오는 컴팩트 디자인
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
    setTimeout(() => setIsAnimating(false), 250)
  }

  return (
    <article className="group bg-white rounded-2xl p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(61,39,29,0.04)] hover:shadow-[0_8px_24px_rgba(61,39,29,0.1)] border border-[#EFEAE2] transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5">
      {/* 3D 메뉴 이미지 영역 (중앙 집중 & 여백 최적화) */}
      <div className="relative w-full aspect-square rounded-xl bg-gradient-to-b from-[#FAF7F2] to-[#F3ECE0] overflow-hidden flex items-center justify-center p-2.5 mb-3 group-hover:scale-[1.02] transition-transform duration-200">
        <img
          src={getMenuImageUrl(menu)}
          alt={menu.name}
          className="w-full h-full object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all duration-200"
          onError={(e) => { e.target.src = DEFAULT_MENU_IMAGE }}
          loading="eager"
        />

        {/* 담긴 수량 배지 */}
        {inCart > 0 && (
          <div className="absolute top-2 right-2 bg-[#3D271D] text-[#FAF7F2] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-scale-in">
            {inCart}
          </div>
        )}
      </div>

      {/* 메뉴명 및 영문명 */}
      <div className="flex flex-col flex-1 mb-2">
        <h3 className="font-serif font-bold text-base text-[#2B1810] leading-tight group-hover:text-[#4A2E1F] transition-colors">
          {menu.name}
        </h3>
        <span className="text-[11px] text-[#9B897D] font-sans mt-0.5">
          {detail.en}
        </span>
      </div>

      {/* 가격 및 담기 버튼 */}
      <div className="pt-2 border-t border-[#F5EFE6] flex items-center justify-between gap-2">
        <span className="font-serif font-extrabold text-base sm:text-lg text-[#3D271D]">
          {menu.price.toLocaleString()}원
        </span>

        <button
          onClick={handleAdd}
          id={`add-to-cart-${menu.menu_id}`}
          aria-label={`${menu.name} 장바구니에 담기`}
          className={`cursor-pointer inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 select-none ${
            inCart > 0
              ? 'bg-[#3D271D] text-[#FAF7F2] hover:bg-[#2B1810] shadow-sm'
              : 'bg-[#F5EFE6] text-[#4A2E1F] hover:bg-[#4A2E1F] hover:text-[#FAF7F2]'
          } ${isAnimating ? 'scale-90' : 'active:scale-95'}`}
        >
          {inCart > 0 ? (
            <>
              <span>+ 추가</span>
              <span className="opacity-80 font-normal">({inCart})</span>
            </>
          ) : (
            <>
              <span className="text-sm font-normal">+</span>
              <span>담기</span>
            </>
          )}
        </button>
      </div>
    </article>
  )
}
