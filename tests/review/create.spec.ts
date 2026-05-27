import { test, expect, type Page } from '@playwright/test';

test.afterEach(async ({ page }, testInfo) => {
  if (true) {
    const screenshot = await page.screenshot({ fullPage: true });

    await testInfo.attach('full-page-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
});

test.describe('Create', () => {
  async function waitForLoginForm(page: Page) {
    const loginButton = page.locator('form').getByRole('button', {
      name: 'Iniciar sesión',
      exact: true,
    });

    await expect(loginButton).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByLabel('Correo electrónico')).toBeEditable();
    await expect(page.locator('#password')).toBeEditable();
    await expect
      .poll(
        async () => {
          try {
            return await page.evaluate(() => {
              const button = document
                .querySelector('form')
                ?.querySelector('button[type="button"]');
              return Boolean(
                button &&
                Object.keys(button).some((key) =>
                  key.startsWith('__reactProps')
                )
              );
            });
          } catch (e) {
            return false;
          }
        },
        { timeout: 15_000 }
      )
      .toBe(true);
  }

  async function fillLoginCredentials(page: Page, email: string) {
    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.locator('#password');

    await emailField.fill(email);
    await passwordField.fill('12345678');

    await expect(emailField).toHaveValue(email);
    await expect(passwordField).toHaveValue('12345678');
    return { emailField, passwordField };
  }

  test('should create a review for a product', async ({ page }) => {
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
    await expect(form).toBeVisible({ timeout: 15_000 });

    const stars = form.locator('button[type="button"]');
    await stars.nth(4).click();
    await form.locator('#comment').fill('Excelente producto, muy recomendado.');

    await form.getByRole('button', { name: 'Publicar comentario' }).click();

    await expect(page.getByText('Excelente producto, muy recomendado.')).toBeVisible();
    await expect(page.getByText('Juan Paredes')).toBeVisible();
  });
});
