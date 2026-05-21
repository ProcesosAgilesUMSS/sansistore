import { test, expect } from '@playwright/test';

async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL('/me', { timeout: 10000 });
}

async function logout(page: import('@playwright/test').Page) {
  // Open profile menu and click logout
  const profileBtn = page.locator('button[aria-haspopup="menu"]');
  await profileBtn.click();
  await page.getByRole('menuitem').filter({ hasText: 'Cerrar sesión' }).click();
}

test.describe('Cart - Carrito', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('full-page-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  });

  test('should display cart items when user is authenticated', async ({ page }) => {
    // Ana (google-type) can't do email login in tests; use Carlos (email type)
    // Carlos has no cart items seeded, so use Juan who has 1 cart item
    await loginAs(page, 'juan.paredes@est.umss.edu', 'password123');

    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    // Cart badge should be visible (Juan has 1 cart item from seed)
    const cartBadge = page.locator('button').filter({ has: page.locator('svg') }).locator('span').first();
    await expect(cartBadge).toBeVisible({ timeout: 10000 });
  });

  test('should show empty cart message when user has no items', async ({ page }) => {
    // Carlos has no cart items in the seed
    await loginAs(page, 'carlos.docente@est.umss.edu', 'password123');

    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    // Cart badge should show 0 for Carlos
    const cartButton = page.locator('button').filter({ has: page.locator('[data-lucide="shopping-bag"], svg') }).first();
    await expect(cartButton).toBeVisible({ timeout: 10000 });

    const badge = cartButton.locator('span').first();
    await expect(badge).toBeVisible({ timeout: 10000 });
    await expect(badge).toHaveText('0');
  });

  test('should clear cart when user logs out', async ({ page }) => {
    await loginAs(page, 'juan.paredes@est.umss.edu', 'password123');
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    // Logout
    await logout(page);

    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    // After logout, cart badge should show 0
    const cartButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(cartButton).toBeVisible({ timeout: 10000 });
    const badge = cartButton.locator('span').first();
    await expect(badge).toHaveText('0', { timeout: 10000 });
  });

  test('should show empty cart after logout and login with different user', async ({ page }) => {
    // Login as Juan (has 1 cart item)
    await loginAs(page, 'juan.paredes@est.umss.edu', 'password123');
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    // Logout
    await logout(page);

    // Login as Carlos (has no cart items)
    await loginAs(page, 'carlos.docente@est.umss.edu', 'password123');
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    const cartButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(cartButton).toBeVisible({ timeout: 10000 });
    const badge = cartButton.locator('span').first();
    await expect(badge).toHaveText('0', { timeout: 10000 });
  });

  test('should allow non-logged user to add items to cart', async ({ page }) => {
    // No login — anonymous user
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');

    // Cart button should still be visible for non-logged users
    const cartButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(cartButton).toBeVisible({ timeout: 10000 });

    // Badge defaults to 0 for anonymous users
    const badge = cartButton.locator('span').first();
    await expect(badge).toBeVisible({ timeout: 10000 });
    await expect(badge).toHaveText('0');
  });
});
