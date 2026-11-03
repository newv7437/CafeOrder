/**
 * 고객 메인 화면 - 메뉴 조회 및 장바구니
 * 경로: /
 */
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import MenuCard from '../../components/customer/MenuCard'
import CartPanel from '../../components/customer/CartPanel'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useCart } from '../../context/CartContext'

const CATEGORIES = ['전체', '커피', '음료', '디저트']

export default function MenuPage() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('전체')
  const [showCart, setShowCart] = useState(false)
  const { totalQuantity } = useCart()

  useEffect(() => {
    async function fetchMenus() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .eq('is_available', true)
          .order('category')
          .order('name')

        if (error) throw error
        setMenus(data || [])
      } catch (err) {
        console.error('메뉴 로드 오류:', err)
        setError('메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [])

  const filtered = activeCategory === '전체'
    ? menus
    : menus.filter(m => m.category === activeCategory)

  return (
    <div className="min-h-screen bg-amber-50">
      {/* 헤더 */}
      <header className="bg-amber-800 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">☕</span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight leading-none">CafeOrder</h1>
              <p className="text-amber-200 text-xs">편리한 카페 주문 서비스</p>
            </div>
          </div>

          {/* 모바일 장바구니 버튼 */}
          <button
            onClick={() => setShowCart(true)}
            id="open-cart-btn"
            aria-label={`장바구니 열기 (${totalQuantity}개)`}
            className="lg:hidden relative bg-amber-700 hover:bg-amber-600 rounded-xl px-4 py-2 font-semibold text-sm transition-colors"
          >
            🛒 장바구니
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" role="tablist" aria-label="메뉴 카테고리">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              id={`category-${cat}`}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 border-2 ${
                activeCategory === cat
                  ? 'bg-amber-700 text-white border-amber-700 shadow-md'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* 메뉴 그리드 */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" text="메뉴를 불러오는 중..." />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">😞</p>
                <p className="text-stone-600 font-medium">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🍃</p>
                <p className="text-stone-600 font-medium">
                  {activeCategory === '전체' ? '현재 판매 중인 메뉴가 없습니다.' : `${activeCategory} 메뉴가 없습니다.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map(menu => (
                  <MenuCard key={menu.menu_id} menu={menu} />
                ))}
              </div>
            )}
          </main>

          {/* 데스크톱 장바구니 */}
          <div className="hidden lg:block w-80 shrink-0">
            <CartPanel />
          </div>
        </div>
      </div>

      {/* 모바일 장바구니 오버레이 */}
      {showCart && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="장바구니"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCart(false)}
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl p-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowCart(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 text-xl"
              aria-label="장바구니 닫기"
            >
              ✕
            </button>
            <CartPanel />
          </div>
        </div>
      )}
    </div>
  )
}
