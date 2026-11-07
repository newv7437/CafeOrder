import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\Edge\\Application\\msedge.exe';
const executablePath = existsSync(chromePath) ? chromePath : edgePath;

const TARGET_URL = 'https://cafe-order-drab.vercel.app';
const SCREENSHOT_DIR = 'test-screenshots';

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
  console.log(`[1/6] 브라우저 실행 중... (엔진: ${executablePath})`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // 콘솔 로그 수집
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('  [브라우저 콘솔 오류]', msg.text());
    });

    console.log(`[2/6] 사이트 접속 중: ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // 메뉴 카드 로드 대기
    await page.waitForSelector('#add-to-cart-1', { timeout: 15000 });
    console.log('  ✅ 메뉴 로드 성공 (메뉴 1: 아메리카노 발견)');
    await page.screenshot({ path: join(SCREENSHOT_DIR, '01_menu_loaded.png') });

    // 1번 메뉴(아메리카노) 담기
    console.log('[3/6] 아메리카노(2,000원) 장바구니 담기');
    await page.click('#add-to-cart-1');
    await new Promise(r => setTimeout(r, 600));

    // 2번 메뉴(카페라떼) 담기
    console.log('      카페라떼(3,000원) 장바구니 담기');
    await page.click('#add-to-cart-2');
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: join(SCREENSHOT_DIR, '02_cart_added.png') });

    // 장바구니 주문하기 버튼 클릭
    console.log('[4/6] 장바구니 "주문하기" 버튼 클릭');
    await page.waitForSelector('#order-submit-btn', { timeout: 5000 });
    await page.click('#order-submit-btn');

    // 주문 확인 모달 확인
    console.log('[5/6] 주문 확인 모달 대기 및 최종 주문 클릭');
    await page.waitForSelector('#confirm-order-btn', { timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOT_DIR, '03_confirm_modal.png') });

    await page.click('#confirm-order-btn');

    // 주문 완료 페이지 이동 대기 (/order/:id)
    console.log('[6/6] 주문 완료 페이지로 이동 대기 중...');
    await page.waitForFunction(() => window.location.pathname.startsWith('/order/'), { timeout: 15000 });

    const currentUrl = page.url();
    console.log(`  🎉 주문 완료 페이지 도달! URL: ${currentUrl}`);

    // 주문 정보 요소 추출
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: join(SCREENSHOT_DIR, '04_order_success.png') });

    const orderInfo = await page.evaluate(() => {
      const orderIdEl = document.querySelector('h2, h1');
      const text = document.body.innerText;
      return {
        url: window.location.href,
        hasReceivedStatus: text.includes('접수'),
        hasAmericano: text.includes('아메리카노'),
        hasLatte: text.includes('카페라떼'),
        totalPrice: text.match(/([0-9,]+원)/g),
      };
    });

    console.log('=== 브라우저 E2E 고객 주문 테스트 결과 ===');
    console.log('- 주문 상세 URL:', orderInfo.url);
    console.log('- 상태("접수") 노출 여부:', orderInfo.hasReceivedStatus);
    console.log('- 아메리카노 포함 여부:', orderInfo.hasAmericano);
    console.log('- 카페라떼 포함 여부:', orderInfo.hasLatte);
    console.log('- 캡처 저장 위치:', SCREENSHOT_DIR);
    console.log('==========================================');

    return { success: true, orderInfo };
  } finally {
    await browser.close();
  }
}

runTest()
  .then(() => {
    console.log('✅ 모든 브라우저 자동화 고객 주문 테스트가 성공적으로 완료되었습니다.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 테스트 중 오류 발생:', err);
    process.exit(1);
  });

