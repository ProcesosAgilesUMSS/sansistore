import { test, expect, type Page } from '@playwright/test';

test.describe('Auth - Login', () => {
  async function waitForLoginForm(page: Page) {
    await expect(
      page.locator('form').getByRole('button', {
        name: 'Iniciar sesión',
        exact: true,
      })
    ).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByLabel('Correo electrónico')).toBeEditable();
    await expect(page.locator('#password')).toBeEditable();
    await page.waitForLoadState('networkidle');
  }

  async function fillLoginCredentials(page: Page, email: string) {
    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.locator('#password');

    for (let attempt = 0; attempt < 3; attempt++) {
      await emailField.fill(email);
      await passwordField.fill('password123');
      await page.waitForTimeout(250);

      if (
        (await emailField.inputValue()) === email &&
        (await passwordField.inputValue()) === 'password123'
      ) {
        return { emailField, passwordField };
      }
    }

    await expect(emailField).toHaveValue(email, { timeout: 10_000 });
    await expect(passwordField).toHaveValue('password123', { timeout: 10_000 });
    return { emailField, passwordField };
  }

  test('should login with email/password and show user on /me', async ({
    page,
  }) => {
    await page.goto('/login');
    await waitForLoginForm(page);

    const { emailField, passwordField } = await fillLoginCredentials(
      page,
      'juan.paredes@est.umss.edu'
    );

    expect(await emailField.inputValue()).toBe('juan.paredes@est.umss.edu');
    expect(await passwordField.inputValue()).toBe('password123');

    await page
      .locator('form')
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/', { timeout: 30_000 });
    await page.goto('/me');
    await expect(page.getByText('No autenticado')).toBeHidden();
    await expect(page.locator('dd', { hasText: 'juan.paredes@est.umss.edu' })).toBeVisible({ timeout: 10000 });
  });

  test('should show "No autenticado" on /me when not authenticated', async ({
    page,
  }) => {
    await page.goto('/me', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('No autenticado')).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.getByRole('link', { name: 'Iniciar sesión' })
    ).toBeVisible();
  });

  test('should show login form on /login when not authenticated', async ({
    page,
  }) => {
    await page.goto('/login');
    await waitForLoginForm(page);
    await expect(page).toHaveTitle('Iniciar sesión | SansiStore');
    await expect(
      page.getByRole('heading', { name: /sansistore/i })
    ).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(
      page.locator('form').getByRole('button', { name: 'Iniciar sesión', exact: true })
    ).toBeVisible();
  });
});
