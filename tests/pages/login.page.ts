import { expect, type Locator, type Page } from '@playwright/test';

const PASSWORD = '12345678';

export class LoginPage {
  readonly page: Page;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailField = page.getByLabel('Correo electrónico');
    this.passwordField = page.locator('#password');
    this.loginButton = page
      .locator('form')
      .getByRole('button', { name: 'Iniciar sesión', exact: true });
  }

  async goto() {
    await this.page.goto('/iniciar-sesion');
  }

  async waitForReady() {
    await expect(this.loginButton).toBeEnabled({ timeout: 15_000 });
    await expect(this.emailField).toBeEditable();
    await expect(this.passwordField).toBeEditable();
    await expect
      .poll(
        async () => {
          try {
            return await this.page.evaluate(() => {
              const button = document
                .querySelector('form')
                ?.querySelector('button[type="submit"]');
              return Boolean(
                button &&
                Object.keys(button).some((key) => key.startsWith('__reactProps'))
              );
            });
          } catch {
            return false;
          }
        },
        { timeout: 15_000 }
      )
      .toBe(true);
  }

  async fillCredentials(email: string) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.emailField.fill(email);
      await this.passwordField.fill(PASSWORD);
      await this.page.waitForTimeout(250);
      if (
        (await this.emailField.inputValue()) === email &&
        (await this.passwordField.inputValue()) === PASSWORD
      ) {
        return;
      }
    }
    await expect(this.emailField).toHaveValue(email, { timeout: 10_000 });
    await expect(this.passwordField).toHaveValue(PASSWORD, { timeout: 10_000 });
  }
}
