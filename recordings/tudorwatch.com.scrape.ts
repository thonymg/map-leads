import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.goto('https://www.tudorwatch.com/fr/retailers/france?lat=46.217049743275915&lng=7.3170101562500145&z=5');
  await page.locator('a[aria-label="See store details"]').click();
  await page.locator('.flex.flex-col.justify-between.ltr:text-left.rtl:text-right').click();
 
});