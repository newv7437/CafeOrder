/**
 * 메뉴 카드 컴포넌트
 */
import { useCart } from '../../context/CartContext'

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'%3E%3Crect width='200' height='200' fill='%23F5F0E8'/%3E%3Ctext x='100' y='115' font-size='70' text-anchor='middle'%3E☕%3C/text%3E%3C/svg%3E"

export default function MenuCard({ menu }) {
  const { addItem, items } = useCart()

  const cartItem = items.find(i => i.menu_id === menu.menu_id)
  const inCart = cartItem ? cartItem.quantity : 0

  function handleAdd() {
    addItem(menu)
  }

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
      {/* 이미지 */}
      <div className="relative overflow-hidden bg-amber-50 h-44">
        <img
          src={menu.image_url || DEFAULT_IMAGE}
          alt={menu.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = DEFAULT_IMAGE }}
          loading="lazy"
        />
        {inCart > 0 && (
          <div className="absolute top-2 right-2 bg-amber-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
            {inCart}
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <span className="bg-white/80 backdrop-blur-sm text-amber-800 text-xs font-medium px-2 py-1 rounded-full">
            {menu.category}
          </span>
        </div>
      </div>

      {/* 정보 */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-stone-800 text-base mb-1 line-clamp-1">{menu.name}</h3>
        <p className="text-amber-700 font-bold text-lg mt-auto pt-2">
          {menu.price.toLocaleString()}원
        </p>

        <button
          onClick={handleAdd}
          id={`add-to-cart-${menu.menu_id}`}
          aria-label={`${menu.name} 장바구니에 추가`}
          className="mt-3 w-full bg-amber-700 hover:bg-amber-800 active:scale-95 text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm"
        >
          {inCart > 0 ? `+ 추가 (${inCart}개)` : '장바구니 담기'}
        </button>
      </div>
    </div>
  )
}
