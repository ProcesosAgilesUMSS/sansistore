import { expect, type Locator, type Page } from '@playwright/test';

export class ProductListPage {
  readonly page: Page;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('textbox', { name: '¿Qué estás buscando hoy?' });
  }

  async goto(query = '') {
    await this.page.goto(`/productos${query}`, { waitUntil: 'domcontentloaded' });
  }

  async expectVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Productos disponibles' })
    ).toBeVisible({ timeout: 30_000 });
  }

  async expectSearchReady() {
    await this.expectVisible();
    await expect(this.searchInput).not.toHaveAttribute('disabled', { timeout: 30_000 });
  }
}
