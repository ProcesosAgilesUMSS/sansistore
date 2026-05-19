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
  test.describe.configure({ mode: 'serial' });

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

    await expect(page).toHaveURL('/me');

    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Galletas Agua Victoria 120 gr')).toBeVisible();
    const summary = page.locator('.cart-summary');
    await expect(summary.getByText('Subtotal')).toBeVisible();
    await expect(summary.getByText('Total de compra')).toBeVisible();
    await expect(page.getByTestId('cart-total')).toHaveText('Bs 27.40');
    await expect(page.getByText('Stock').first()).toBeVisible();
    await expect(page.getByText('Disponible').first()).toBeVisible();
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

    await expect(page).toHaveURL('/me');

    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible({
      timeout: 1000,
    });
    await expect(page.getByText('Total de compra')).toBeVisible();
    await expect(page.getByText('Bs 0.00')).toBeVisible();
  });

  test('should remove an item and update the total', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill('juan.paredes@est.umss.edu');
    await page.getByLabel('Contraseña').fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/me');

    await page.goto('/cart');

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Galletas Agua Victoria 120 gr')).toBeVisible();
    await expect(page.getByTestId('cart-total')).toHaveText('Bs 27.40');

    await page
      .getByRole('button', { name: 'Eliminar Galletas Agua Victoria 120 gr' })
      .click();
    await page
      .getByRole('dialog', { name: 'Eliminar producto' })
      .getByRole('button', { name: 'Eliminar' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Galletas Agua Victoria 120 gr' })
    ).toBeHidden();
    await expect(page.getByTestId('cart-total')).toHaveText('Bs 19.40');
  });

  test('should show "No autenticado" when accessing cart without login', async ({
    page,
  }) => {
    await page.goto('/cart');

    await expect(page.getByText('No autenticado')).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'Iniciar sesión' })
    ).toBeVisible();
  });
});
