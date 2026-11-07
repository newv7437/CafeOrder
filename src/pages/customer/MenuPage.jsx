/**
 * 미니멀 프리미엄 고객 메인 화면
 * 첫 화면(First Fold) 최적화 레이아웃
 * 경로: /
 */
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import MenuCard from '../../components/customer/MenuCard'
import CartPanel from '../../components/customer/CartPanel'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useCart } from '../../context/CartContext'

const CATEGORIES = ['전체', '커피', '논커피', '디저트']

export default function MenuPage() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
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

  // 카테고리 및 검색어 필터링
  const filtered = useMemo(() => {
    return menus.filter(menu => {
      let matchCategory = true
      if (activeCategory === '커피') {
        matchCategory = menu.category === '커피'
      } else if (activeCategory === '논커피') {
        matchCategory = menu.category === '음료' || menu.category === '논커피'
      } else if (activeCategory === '디저트') {
        matchCategory = menu.category === '디저트'
      }

      const matchSearch = searchQuery.trim() === ''
        ? true
        : menu.name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchCategory && matchSearch
    })
  }, [menus, activeCategory, searchQuery])

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B1810]">
      {/* 슬림하고 세련된 헤더 */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-[#EFEAE2] shadow-[0_1px_10px_rgba(61,39,29,0.03)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* 브랜드 로고 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#3D271D] text-[#FAF7F2] flex items-center justify-center font-serif text-base font-bold shadow-sm">
              ☕
            </div>
            <div>
              <h1 className="text-lg font-serif font-black tracking-tight text-[#2B1810] leading-none">
                COFFEE HOUSE
              </h1>
              <span className="text-[10px] font-sans tracking-widest uppercase text-[#8C7769] font-medium block">
                Specialty Roastery
              </span>
            </div>
          </div>

          {/* 데스크톱 검색창 */}
          <div className="hidden sm:block w-72">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#A08E82]">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your coffee..."
                className="w-full bg-[#FAF7F2] border border-[#E8E1D7] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[#2B1810] placeholder-[#B09E91] focus:outline-none focus:bg-white focus:border-[#4A2E1F] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#A08E82] hover:text-[#4A2E1F]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 모바일 장바구니 버튼 */}
          <button
            onClick={() => setShowCart(true)}
            id="open-cart-btn"
            aria-label={`장바구니 열기 (${totalQuantity}개)`}
            className="lg:hidden relative bg-[#3D271D] text-[#FAF7F2] rounded-xl px-3.5 py-2 font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>🧺</span>
            <span>Cart</span>
            {totalQuantity > 0 && (
              <span className="bg-[#B8860B] text-white text-[10px] rounded-full px-1.5 py-0.2 font-bold">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 (상하 여백 최적화) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        {/* 한 줄 타이틀 및 카테고리 컨트롤 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          {/* 한 줄 환영 슬로건 */}
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2B1810] tracking-tight">
            Enjoy the real taste of coffee.
          </h2>

          {/* 카테고리 둥근 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="메뉴 카테고리">
            {CATEGORIES.map(cat => {
              const isSelected = activeCategory === cat
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveCategory(cat)}
                  id={`category-${cat}`}
                  className={`cursor-pointer px-4 py-1.5 rounded-full font-serif font-semibold text-xs tracking-wide whitespace-nowrap transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-[#3D271D] text-[#FAF7F2] shadow-sm'
                      : 'bg-white text-[#7C6A5E] hover:text-[#3D271D] hover:bg-[#F3ECE0] border border-[#EBE4DA]'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* 모바일 검색창 (작은 화면일 때만 노출) */}
        <div className="block sm:hidden mb-4">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#A08E82]">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find your coffee..."
              className="w-full bg-white border border-[#E8E1D7] rounded-full pl-9 pr-3.5 py-2 text-xs text-[#2B1810] placeholder-[#B09E91] focus:outline-none focus:border-[#4A2E1F]"
            />
          </div>
        </div>

        {/* 2열/3열 그리드 & 오른쪽 고정 장바구니 */}
        <div className="flex items-start gap-6">
          {/* 메뉴 그리드 (첫 화면에 즉시 꽉 차게 노출) */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" text="메뉴를 준비하고 있습니다..." />
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-2xl p-6 border border-[#EFEAE2]">
                <p className="text-3xl mb-2">☕</p>
                <p className="text-xs font-medium text-[#7C6A5E]">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-5 py-2 bg-[#3D271D] text-[#FAF7F2] text-xs font-semibold rounded-xl hover:bg-[#2B1810]"
                >
                  새로고침
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl p-6 border border-[#EFEAE2]">
                <p className="text-3xl mb-2">🍃</p>
                <p className="text-xs font-medium text-[#7C6A5E]">
                  {searchQuery ? `"${searchQuery}"에 해당하는 메뉴가 없습니다.` : `${activeCategory} 카테고리에 등록된 메뉴가 없습니다.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4.5">
                {filtered.map(menu => (
                  <MenuCard key={menu.menu_id} menu={menu} />
                ))}
              </div>
            )}
          </main>

          {/* 데스크톱 오른쪽 고정 장바구니 패널 */}
          <div className="hidden lg:block w-80 shrink-0 sticky top-20">
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
            className="absolute inset-0 bg-[#2B1810]/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowCart(false)}
          />
          <div className="relative bg-[#FBF9F5] rounded-t-3xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up border-t border-[#EFEAE2]">
            <button
              onClick={() => setShowCart(false)}
              className="absolute top-4 right-4 text-[#8C7769] hover:text-[#2B1810] text-sm w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
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
