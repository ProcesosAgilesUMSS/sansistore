import { test, expect, defineConfig, type Page } from '@playwright/test';

test.afterEach(async ({ page }, testInfo) => {
  if (true) {
    const screenshot = await page.screenshot({ fullPage: true });

    await testInfo.attach('full-page-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
});

export default defineConfig({
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  use: {
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
});

test.describe('Post', () => {
  async function waitForLoginForm(page: Page) {
    const loginButton = page.locator('form').getByRole('button', {
      name: 'Iniciar sesión',
      exact: true,
    });

    await expect(loginButton).toBeEnabled();
    await expect(page.getByLabel('Correo electrónico')).toBeEditable();
    await expect(page.locator('#password')).toBeEditable();
  }

 async function fillLoginCredentials(page: Page, email: string) {
    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.locator('#password');

    await emailField.click();
    await emailField.clear();

    await emailField.pressSequentially(email, { delay: 50 });
    await emailField.blur();

    await passwordField.click();
    await passwordField.clear();
    await passwordField.fill('12345678');

    await expect(emailField).toHaveValue(email);
    await expect(passwordField).toHaveValue('12345678');

    return { emailField, passwordField };
  }

  test('should post a review for a product', async ({ page }) => {
    await page.goto('/login');
    await waitForLoginForm(page);

    const { emailField, passwordField } = await fillLoginCredentials(
      page,
      'juan.paredes@est.umss.edu'
    );

    expect(await emailField.inputValue()).toBe('juan.paredes@est.umss.edu');
    expect(await passwordField.inputValue()).toBe('12345678');

    await page
      .locator('form')
      .getByRole('button', { name: 'Iniciar sesión', exact: true }).click();

    await expect(page).not.toHaveURL(/.*\/login/);

    await page.goto('/productos/aceite-fino-vegetal-900-ml');

    await expect(
      page.getByRole('heading', { name: 'Tu opinión' })
    ).toBeVisible();

    const form = page.locator('form').filter({ hasText: 'Publicar comentario' });
    await expect(form).toBeVisible();

    const stars = form.locator('button[type="button"]');
    await stars.nth(4).click();

    const commentField = form.locator('#comment');
    await expect(commentField).toBeEditable();
    await commentField.fill('Excelente producto, muy recomendado.');

    await expect(page.getByText('Excelente producto, muy recomendado.')).toBeVisible();
    await expect(page.getByText('Juan Paredes')).toBeVisible();
  });
});
