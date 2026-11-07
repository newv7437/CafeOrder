/**
 * 장바구니 상태 관리 (localStorage 연동)
 * Context API를 사용하여 전역 상태 관리
 */
import { createContext, useContext, useReducer, useEffect } from 'react'
import { getMenuImageUrl } from '../lib/menuImages'

const STORAGE_KEY = 'cafeorder_cart'
const MAX_TOTAL_QUANTITY = 20

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { menu } = action.payload
      const existing = state.items.find(i => i.menu_id === menu.menu_id)
      const currentTotal = state.items.reduce((sum, i) => sum + i.quantity, 0)

      if (existing) {
        if (currentTotal >= MAX_TOTAL_QUANTITY) {
          return { ...state, error: `최대 ${MAX_TOTAL_QUANTITY}개까지 주문할 수 있습니다.` }
        }
        return {
          ...state,
          error: null,
          items: state.items.map(i =>
            i.menu_id === menu.menu_id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }

      if (currentTotal >= MAX_TOTAL_QUANTITY) {
        return { ...state, error: `최대 ${MAX_TOTAL_QUANTITY}개까지 주문할 수 있습니다.` }
      }

      return {
        ...state,
        error: null,
        items: [
          ...state.items,
          {
            menu_id: menu.menu_id,
            name: menu.name,
            price: menu.price,
            image_url: getMenuImageUrl(menu),
            quantity: 1,
          },
        ],
      }
    }

    case 'INCREMENT': {
      const currentTotal = state.items.reduce((sum, i) => sum + i.quantity, 0)
      if (currentTotal >= MAX_TOTAL_QUANTITY) {
        return { ...state, error: `최대 ${MAX_TOTAL_QUANTITY}개까지 주문할 수 있습니다.` }
      }
      return {
        ...state,
        error: null,
        items: state.items.map(i =>
          i.menu_id === action.payload.menuId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      }
    }

    case 'DECREMENT': {
      const item = state.items.find(i => i.menu_id === action.payload.menuId)
      if (!item) return state
      if (item.quantity <= 1) {
        return {
          ...state,
          error: null,
          items: state.items.filter(i => i.menu_id !== action.payload.menuId),
        }
      }
      return {
        ...state,
        error: null,
        items: state.items.map(i =>
          i.menu_id === action.payload.menuId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        ),
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        error: null,
        items: state.items.filter(i => i.menu_id !== action.payload.menuId),
      }

    case 'CLEAR_CART':
      return { items: [], error: null }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'LOAD_FROM_STORAGE':
      return { ...state, items: action.payload.items }

    default:
      return state
  }
}

const initialState = { items: [], error: null }

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // localStorage에서 복원
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items = JSON.parse(stored)
        if (Array.isArray(items)) {
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: { items } })
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // 변경 시 localStorage 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const totalQuantity = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const value = {
    items: state.items,
    error: state.error,
    totalQuantity,
    totalPrice,
    addItem: (menu) => dispatch({ type: 'ADD_ITEM', payload: { menu } }),
    increment: (menuId) => dispatch({ type: 'INCREMENT', payload: { menuId } }),
    decrement: (menuId) => dispatch({ type: 'DECREMENT', payload: { menuId } }),
    removeItem: (menuId) => dispatch({ type: 'REMOVE_ITEM', payload: { menuId } }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart는 CartProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
