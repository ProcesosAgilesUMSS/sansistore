import { test, expect } from '@playwright/test';

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot({
      fullPage: true,
    });

    await testInfo.attach('full-page-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
});

test.describe('Cart - Carrito', () => {
  test('should display cart items when user is authenticated', async ({
    page,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.getByLabel('Contraseña');

    await emailField.fill('juan.paredes@est.umss.edu');
    await passwordField.fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/');

    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible();
    await expect(page.getByText('Bs 9.70 / u')).toBeVisible();
    await expect(page.getByText('Bs 19.40', { exact: true })).toBeVisible();
    await expect(page.getByText('2', { exact: true })).toBeVisible();

    await expect(page.getByText('Galletas Agua Victoria 120 gr')).toBeVisible();
    await expect(page.getByText('Bs 8.00 / u')).toBeVisible();
    await expect(page.getByText('Bs 8.00', { exact: true })).toBeVisible();
    await expect(page.getByText('1', { exact: true })).toBeVisible();
  });

  test('should show empty cart message when user has no items', async ({
    page,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.getByLabel('Contraseña');

    await emailField.fill('carlos.docente@est.umss.edu');
    await passwordField.fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/');

    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Comprar ahora' })).toBeVisible();
  });

  test('should clear cart when user logs out', async ({ page }) => {
    await page.goto('/login');

    await page
      .getByLabel('Correo electrónico')
      .fill('juan.paredes@est.umss.edu');
    await page.getByLabel('Contraseña').fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/');

    await page.goto('/cart');

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible();

    await page.goto('/logout');

    await expect(page).toHaveURL('/login');

    await page.goto('/cart');

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('should show empty cart after logout and login with different user', async ({
    page,
  }) => {
    await page.goto('/login');

    await page
      .getByLabel('Correo electrónico')
      .fill('juan.paredes@est.umss.edu');
    await page.getByLabel('Contraseña').fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/');

    await page.goto('/cart');

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible();

    await page.goto('/logout');

    await expect(page).toHaveURL('/login');

    // Login with carlos
    await page.getByLabel('Correo electrónico').fill('carlos.docente@est.umss.edu');
    await page.getByLabel('Contraseña').fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/me');

    // Navigate to cart and verify it's empty (carlos has no items)
    await page.goto('/cart');

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('should allow non-logged user to add items to cart', async ({
    page,
  }) => {
    // Add first product (Leche PIL)
    await page.goto('/productos/leche-pil-natural-900-ml');
    await expect(
      page.getByRole('heading', { name: /Leche PIL Natural 900 ml/ })
    ).toBeVisible();
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();

    // Add second product (Detergente)
    await page.goto('/productos/detergente-liquido-ola-futuro-limpieza-completa-5-l');
    await expect(
      page.getByRole('heading', { name: /Detergente Liquido Ola Futuro/ })
    ).toBeVisible();
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();

    // Add third product (Galletas)
    await page.goto('/productos/galletas-agua-victoria-120-gr');
    await expect(
      page.getByRole('heading', { name: /Galletas Agua Victoria 120 gr/ })
    ).toBeVisible();
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();

    // Navigate to cart and verify all 3 products are there with 1 unit each
    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible();
    await expect(page.getByText('Detergente Liquido Ola Futuro').first()).toBeVisible();
    await expect(page.getByText('Galletas Agua Victoria 120 gr')).toBeVisible();

    // Verify each product has 1 unit
    const quantities = page.locator('[data-testid*="quantity"]');
    const count = await quantities.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(quantities.nth(i)).toHaveText('1');
      }
    }
  });

  
});
