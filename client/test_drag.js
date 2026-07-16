import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[EXCEPTION]:', err.stack || err.message);
  });

  console.log('Navigating to home...');
  await page.goto('http://localhost:3005/', { waitUntil: 'networkidle' });

  // Wait for initial load
  await page.waitForTimeout(3000);

  // Check if we need to log in
  const emailInput = page.locator('input[name="emailOrUsername"]');
  if (await emailInput.count() > 0) {
    console.log('Logging in...');
    await emailInput.fill('admin@example.com');
    await page.fill('input[name="password"]', 'admin12345');
    await page.click('button.primary');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  }

  // Wait for loader to disappear
  await page.waitForSelector('.ui.active.loader', { state: 'detached', timeout: 25000 }).catch(() => {});
  console.log('Loader disappeared. Navigating directly to Board 2 URL...');
  
  await page.goto('http://localhost:3005/boards/1813823380684539094', { waitUntil: 'networkidle' });
  await page.waitForSelector('.ui.active.loader', { state: 'detached', timeout: 25000 }).catch(() => {});
  console.log('Board loaded.');

  // Find board tabs "1" and "2"
  const tabs = page.locator('[data-board-id]');
  const count = await tabs.count();
  let inactiveBoardTab = null;
  for (let i = 0; i < count; i++) {
    const text = await tabs.nth(i).innerText();
    if (text.trim() === '1') {
      inactiveBoardTab = tabs.nth(i);
    }
  }

  // Find the list named "10"
  const listHeaders = page.locator('[class*="headerName"]');
  let listIndexToDrag = -1;
  for (let i = 0; i < await listHeaders.count(); i++) {
    const text = await listHeaders.nth(i).innerText();
    if (text.trim() === '10') {
      listIndexToDrag = i;
    }
  }

  const sourceListHeader = listHeaders.nth(listIndexToDrag);
  const targetBoardTab = inactiveBoardTab;

  const sourceBox = await sourceListHeader.boundingBox();
  const targetBox = await targetBoardTab.boundingBox();

  if (sourceBox && targetBox) {
    const startX = sourceBox.x + sourceBox.width / 2;
    const startY = sourceBox.y + sourceBox.height / 2;
    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + targetBox.height / 2;

    // Mouse down at source
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(500);

    // Move to target
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.waitForTimeout(1000);

    // Inspect ALL elements at target coordinates
    const elementsStack = await page.evaluate((coords) => {
      const els = document.elementsFromPoint(coords.x, coords.y);
      return els.map((el, idx) => ({
        index: idx,
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        attributes: Array.from(el.attributes).map(attr => `${attr.name}=${attr.value}`),
      }));
    }, { x: endX, y: endY });

    console.log('Elements stack under mouse coordinates (70, 79) during drag:');
    console.log(JSON.stringify(elementsStack, null, 2));

    await page.mouse.up();
    await page.waitForTimeout(3000);
  }

  await browser.close();
  console.log('Test completed.');
})();
