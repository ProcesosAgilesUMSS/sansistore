import { test, expect } from '@playwright/test';

test.describe('Auth - Login', () => {
  test('should login with email/password and show user on /me', async ({
    page,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.getByLabel('Contraseña');

    await emailField.fill('juan.paredes@est.umss.edu');
    await passwordField.fill('password123');

    expect(await emailField.inputValue()).toBe('juan.paredes@est.umss.edu');
    expect(await passwordField.inputValue()).toBe('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/');
    await page.goto('/me');
    await expect(page.getByText('No autenticado')).toBeHidden();
    await expect(page.locator('dd', { hasText: 'juan.paredes@est.umss.edu' })).toBeVisible({ timeout: 10000 });
  });

  test('should show "No autenticado" on /me when not authenticated', async ({
    page,
  }) => {
    await page.goto('/me');

    await expect(page.getByText('No autenticado')).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'Iniciar sesión' })
    ).toBeVisible();
  });

  test('should show login form on /login when not authenticated', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle('Iniciar sesión | SansiStore');
    await expect(
      page.getByRole('heading', { name: 'Iniciar sesión' })
    ).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Iniciar sesión', exact: true })
    ).toBeVisible();
  });
});
