import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.wikipedia.org/');
  await page.getByRole('link', { name: 'Français 2 740 000+ articles' }).click();
  await page.getByRole('link', { name: 'Le Martyre de sainte Catherine', exact: true }).click();
  await page.getByRole('link', { name: 'Théodore-Edmond Plumier' }).nth(2).click();
  await page.getByRole('link', { name: 'Englebert Fisen' }).nth(1).click();
  await page.getByRole('link', { name: 'Aperçu de son œuvre' }).click();
});