const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:8000/index.html');
  await page.screenshot({ path: 'artifacts/screenshot.png', fullPage: true });
  await browser.close();
})();
