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
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Wait for initial load
  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());

  // Check if we need to log in
  const emailInput = page.locator('input[name="emailOrUsername"]');
  if (await emailInput.count() > 0) {
    console.log('Logging in...');
    await emailInput.fill('admin@example.com');
    await page.fill('input[name="password"]', 'admin12345');
    await page.click('button.primary');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    console.log('After login, URL is:', page.url());
  }

  // Wait for loader to disappear
  console.log('Waiting for loader to disappear...');
  await page.waitForSelector('.ui.active.loader', { state: 'detached', timeout: 25000 }).catch(() => console.log('Timeout waiting for loader to detach.'));
  console.log('Loader disappeared. Navigating directly to Board 2 URL...');
  
  await page.goto('http://localhost:3000/boards/1813823380684539094', { waitUntil: 'networkidle' });
  console.log('Waiting for board loader to disappear...');
  await page.waitForSelector('.ui.active.loader', { state: 'detached', timeout: 25000 }).catch(() => console.log('Timeout waiting for board loader to detach.'));
  console.log('Board loader disappeared. Waiting 3 more seconds...');
  await page.waitForTimeout(3000);
  console.log('Current URL after direct board navigation:', page.url());

  // Print all elements
  const elementDetails = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    return all.map(el => ({
      tagName: el.tagName,
      className: el.className,
      text: el.innerText ? el.innerText.trim().slice(0, 100) : '',
    })).filter(info => info.tagName !== 'STYLE' && info.tagName !== 'SCRIPT' && (info.className || info.text));
  });
  console.log('Element Details (first 200):');
  console.log(elementDetails.slice(0, 200));

  await browser.close();
  console.log('Completed.');
})();
