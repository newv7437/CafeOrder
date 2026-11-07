/**
 * 3D 일러스트 스타일 카페 메뉴 이미지 매핑
 */
export const DEFAULT_MENU_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'%3E%3Crect width='200' height='200' fill='%23F5F0E8'/%3E%3Ctext x='100' y='115' font-size='70' text-anchor='middle'%3E☕%3C/text%3E%3C/svg%3E"

export const MENU_IMAGES = {
  '아메리카노': '/images/menus/americano.jpg',
  '카페라떼': '/images/menus/latte.jpg',
  '바닐라라떼': '/images/menus/vanilla_latte.jpg',
  '카푸치노': '/images/menus/cappuccino.jpg',
  '레몬에이드': '/images/menus/lemonade.jpg',
  '초코라떼': '/images/menus/choco_latte.jpg',
  '치즈케이크': '/images/menus/cheesecake.jpg',
  '초코쿠키': '/images/menus/choco_cookie.jpg',
}

/**
 * 메뉴 객체 또는 이름을 받아 해당하는 3D 이미지 경로를 반환합니다.
 */
export function getMenuImageUrl(menuOrName) {
  if (!menuOrName) return DEFAULT_MENU_IMAGE
  if (typeof menuOrName === 'string') {
    return MENU_IMAGES[menuOrName] || DEFAULT_MENU_IMAGE
  }
  return menuOrName.image_url || MENU_IMAGES[menuOrName.name] || DEFAULT_MENU_IMAGE
}
