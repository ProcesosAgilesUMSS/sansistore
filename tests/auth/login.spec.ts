import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

function isLoginPath(url: string) {
  return url.includes('/login') || url.includes('/iniciar-sesion');
}

test.describe('Auth - Login', () => {
  test('should login with email/password and show user on /me', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const login = new LoginPage(page);
    await login.goto();
    await login.waitForReady();

    const email = 'juan.paredes@est.umss.edu';
    await login.fillCredentials(email);

    expect(await login.emailField.inputValue()).toBe(email);
    expect(await login.passwordField.inputValue()).toBe('12345678');

    for (let attempt = 0; attempt < 3; attempt++) {
      if (!isLoginPath(page.url())) {
        break;
      }
      try {
        await login.loginButton.click({ noWaitAfter: true, timeout: 2000 });
      } catch {
        if (!isLoginPath(page.url())) {
          break;
        }
      }
      await page.waitForTimeout(1000);
    }

    await expect(page).not.toHaveURL(/\/(?:login|iniciar-sesion)/, { timeout: 30_000 });

    await page.goto('/me');
    await expect(page.getByText('No autenticado')).toBeHidden({
      timeout: 15_000,
    });
    await expect(
      page.locator('dd', { hasText: 'juan.paredes@est.umss.edu' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should show "No autenticado" on /me when not authenticated', async ({
    page,
  }) => {
    await page.goto('/me', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('No autenticado')).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.locator('main').getByRole('link', { name: 'Iniciar sesión' })
    ).toBeVisible();
  });

  test('should show login form on /login when not authenticated', async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.waitForReady();
    await expect(page).toHaveTitle('Iniciar sesión | SansiStore');
    await expect(
      page.getByRole('heading', { name: /sansistore/i })
    ).toBeVisible();
    await expect(login.emailField).toBeVisible();
    await expect(login.passwordField).toBeVisible();
    await expect(login.loginButton).toBeVisible();
  });
});
