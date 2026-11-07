/**
 * 미니멀 프리미엄 고객 메인 화면
 * Minimal Premium · 따뜻한 아이보리 + 에스프레소 브라운
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
      // 카테고리 매핑: '음료' -> '논커피'
      let matchCategory = true
      if (activeCategory === '커피') {
        matchCategory = menu.category === '커피'
      } else if (activeCategory === '논커피') {
        matchCategory = menu.category === '음료' || menu.category === '논커피'
      } else if (activeCategory === '디저트') {
        matchCategory = menu.category === '디저트'
      }

      // 검색어 매칭
      const matchSearch = searchQuery.trim() === ''
        ? true
        : menu.name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchCategory && matchSearch
    })
  }, [menus, activeCategory, searchQuery])

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B1810] selection:bg-[#EBDDCF]">
      {/* 프리미엄 미니멀 상단 헤더 */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-[#EFEAE2] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* 브랜드 로고 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3D271D] text-[#FAF7F2] flex items-center justify-center font-serif text-lg font-bold shadow-md">
              ☕
            </div>
            <div>
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-[#8C7769] font-semibold block">
                Specialty Roastery
              </span>
              <h1 className="text-xl font-serif font-black tracking-tight text-[#2B1810] leading-none">
                COFFEE HOUSE
              </h1>
            </div>
          </div>

          {/* 모바일 장바구니 버튼 */}
          <button
            onClick={() => setShowCart(true)}
            id="open-cart-btn"
            aria-label={`장바구니 열기 (${totalQuantity}개)`}
            className="lg:hidden relative bg-[#3D271D] text-[#FAF7F2] rounded-2xl px-4 py-2.5 font-medium text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <span>🧺</span>
            <span>Cart</span>
            {totalQuantity > 0 && (
              <span className="bg-[#B8860B] text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold shadow-sm">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 메인 컨테이너 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* 환영 타이틀 & 검색 영역 */}
        <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#B8860B] mb-2 block">
              Handcrafted with Passion
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-[#2B1810] leading-tight tracking-tight">
              Enjoy the real taste <br className="hidden sm:inline" />
              of coffee.
            </h2>
            <p className="text-sm text-[#7A695C] mt-2 font-sans max-w-md">
              매일 엄선하는 스페셜티 원두와 정성으로 내린 프리미엄 한 잔을 만나보세요.
            </p>
          </div>

          {/* 미니멀 검색 인풋 */}
          <div className="w-full sm:w-72">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#A08E82]">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your coffee..."
                className="w-full bg-white border border-[#E8E1D7] rounded-full pl-10 pr-4 py-3 text-xs text-[#2B1810] placeholder-[#B09E91] focus:outline-none focus:border-[#4A2E1F] focus:ring-2 focus:ring-[#4A2E1F]/10 shadow-[0_2px_10px_rgba(61,39,29,0.03)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#A08E82] hover:text-[#4A2E1F]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 둥근 카테고리 탭 (전체, 커피, 논커피, 디저트) */}
        <div className="flex gap-2.5 mb-8 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="메뉴 카테고리">
          {CATEGORIES.map(cat => {
            const isSelected = activeCategory === cat
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveCategory(cat)}
                id={`category-${cat}`}
                className={`cursor-pointer px-6 py-2.5 rounded-full font-serif font-semibold text-xs tracking-wide whitespace-nowrap transition-all duration-200 select-none ${
                  isSelected
                    ? 'bg-[#3D271D] text-[#FAF7F2] shadow-md shadow-[#3D271D]/15 scale-105'
                    : 'bg-white text-[#7C6A5E] hover:text-[#3D271D] hover:bg-[#F3ECE0] border border-[#EBE4DA]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* 2열/3열 그리드 & 오른쪽 고정 장바구니 */}
        <div className="flex items-start gap-8">
          {/* 메뉴 그리드 */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center py-28">
                <LoadingSpinner size="lg" text="최고의 메뉴를 선별하는 중입니다..." />
              </div>
            ) : error ? (
              <div className="text-center py-24 bg-white rounded-3xl p-8 border border-[#EFEAE2]">
                <p className="text-4xl mb-3">☕</p>
                <p className="text-sm font-medium text-[#7C6A5E]">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2.5 bg-[#3D271D] text-[#FAF7F2] text-xs font-semibold rounded-2xl hover:bg-[#2B1810] transition-colors"
                >
                  새로고침
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl p-8 border border-[#EFEAE2]">
                <p className="text-4xl mb-3">🍃</p>
                <p className="text-sm font-medium text-[#7C6A5E]">
                  {searchQuery ? `"${searchQuery}"에 해당하는 메뉴가 없습니다.` : `${activeCategory} 카테고리에 등록된 메뉴가 없습니다.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(menu => (
                  <MenuCard key={menu.menu_id} menu={menu} />
                ))}
              </div>
            )}
          </main>

          {/* 데스크톱 오른쪽 고정 장바구니 패널 */}
          <div className="hidden lg:block w-84 shrink-0">
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
          <div className="relative bg-[#FBF9F5] rounded-t-[32px] shadow-2xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up border-t border-[#EFEAE2]">
            <button
              onClick={() => setShowCart(false)}
              className="absolute top-5 right-5 text-[#8C7769] hover:text-[#2B1810] text-lg w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
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
