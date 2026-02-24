import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
 
  await page.goto('https://www.linkedin.com/feed/');

  await page.getByTestId('typeahead-input').fill('anthony michel');
  await page.getByRole('button', { name: 'anthony michel • Vous • Co-' }).click();
  await page.getByTestId('typeahead-results-overlay').click();
  await page.goto('https://www.linkedin.com/in/thonymg/');
  await page.getByRole('link', { name: 'Tout afficher' }).click();
});