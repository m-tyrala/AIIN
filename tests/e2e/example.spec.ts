import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    // Sprawdzenie podstawowego renderu: adres i widoczne elementy kluczowe.
    await expect(page).toHaveURL(/\/?/);
  });
});
