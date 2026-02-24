import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.wikipedia.org/');
  await page.getByRole('link', { name: 'Français 2 740 000+ articles' }).click();
  await page.getByRole('link', { name: 'wiki', exact: true }).click();
  await page.getByRole('link', { name: 'Identification des visiteurs' }).click();
  await page.getByRole('link', { name: 'Fonctionnement humain' }).click();
  await page.getByRole('link', { name: 'Notes et références' }).click();
  await page.getByRole('link', { name: 'le Wiki CRAO, premier « wiki' }).click();
});