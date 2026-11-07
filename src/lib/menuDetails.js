/**
 * 스페셜티 카페 감성의 메뉴 디테일 정보
 */
export const MENU_DETAILS = {
  '아메리카노': {
    en: 'Americano',
    sub: 'Deep & Rich Espresso',
    desc: '다크 초콜릿의 묵직한 바디감과 고소한 풍미의 시그니처 블렌드',
    rating: '4.9',
  },
  '카페라떼': {
    en: 'Cafe Latte',
    sub: 'Velvety Milk & Espresso',
    desc: '신선한 우유의 실키한 부드러움과 에스프레소의 감미로운 조화',
    rating: '4.9',
  },
  '바닐라라떼': {
    en: 'Vanilla Latte',
    sub: 'Sweet Bourbon Vanilla',
    desc: '천연 마다가스카르 바닐라 시럽의 깊고 은은한 달콤함',
    rating: '4.8',
  },
  '카푸치노': {
    en: 'Cappuccino',
    sub: 'Cloud Foam & Cocoa',
    desc: '구름처럼 몽실한 밀크폼 위에 쌉싸름한 코코아 파우더의 조화',
    rating: '4.7',
  },
  '레몬에이드': {
    en: 'Lemonade',
    sub: 'Sparkling Fresh Citrus',
    desc: '생레몬을 착즙한 상큼함과 시원하고 청량한 스파클링 에이드',
    rating: '4.8',
  },
  '초코라떼': {
    en: 'Chocolate Latte',
    sub: 'Rich Dutch Chocolate',
    desc: '진한 더치 초콜릿과 부드러운 크림의 달콤한 밸런스',
    rating: '4.9',
  },
  '치즈케이크': {
    en: 'Cheesecake',
    sub: 'New York Baked Classic',
    desc: '프리미엄 크림치즈의 깊고 진한 밀도를 품은 수제 베이크드 케이크',
    rating: '5.0',
  },
  '초코쿠키': {
    en: 'Choco Cookie',
    sub: 'Chunky Dark Chocolate',
    desc: '통 초콜릿 청크가 듬뿍 들어간 겉바속촉 아메리칸 클래식 쿠키',
    rating: '4.8',
  },
}

export function getMenuDetail(name) {
  return MENU_DETAILS[name] || {
    en: 'Specialty Item',
    sub: 'Handcrafted',
    desc: '정성을 다해 준비한 스페셜티 메뉴입니다.',
    rating: '4.8',
  }
}

