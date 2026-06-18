import { expect, type Locator, type Page } from '@playwright/test';

export class ProductDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(slug: string) {
    await this.page.goto(`/productos/${slug}`, { waitUntil: 'domcontentloaded' });
  }

  heading(name: string | RegExp): Locator {
    return this.page.getByRole('heading', { name });
  }

  // ponytail: repeated 6x — goto + heading visible with timeout
  async waitForHeading(name: string | RegExp) {
    await expect(this.heading(name)).toBeVisible({ timeout: 30_000 });
  }
}
