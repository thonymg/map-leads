import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.goto('https://www.audemarspiguet.com/com/fr/stores.html?search=france');
  await page.getByRole('list').waitFor({ state: 'visible', timeout: 20000 });
});