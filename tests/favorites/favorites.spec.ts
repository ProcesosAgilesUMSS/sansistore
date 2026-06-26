import { test, expect, type Page } from '@playwright/test';

const FAVORITES_KEY = 'sansistore_favorites';
const ADD_FAVORITE_BUTTON_SELECTOR =
  'button[aria-label^="Agregar "][aria-label$=" a favoritos"]';
const SEE_PRODUCTS_LINK = /Ver productos/;

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot({ fullPage: true });

    await testInfo.attach('full-page-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
});

test.describe('Favorite products', () => {
  async function openCleanProducts(page: Page) {
    await page.goto('/productos', { waitUntil: 'domcontentloaded' });
    await page.evaluate((key) => {
      window.localStorage.removeItem(key);
    }, FAVORITES_KEY);
    await page.reload();
  }

  async function seedLocalFavorites(page: Page, productId: string) {
    await page.goto('/productos', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ({ key, item }) => {
        window.localStorage.setItem(key, JSON.stringify([item]));
      },
      {
        key: FAVORITES_KEY,
        item: { productId, createdAt: Date.now() },
      }
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
  }

  test('allows anonymous users to add and persist a favorite product', async ({
    page,
  }) => {
    await openCleanProducts(page);
    await expect(
      page.getByRole('heading', { name: 'Productos disponibles' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Ver favoritos' })
    ).toHaveAttribute('href', '/favoritos');

    const favoriteButton = page.locator(ADD_FAVORITE_BUTTON_SELECTOR).first();
    await expect(favoriteButton).toBeVisible({ timeout: 15000 });
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
    const favoriteTestId = await favoriteButton.getAttribute('data-testid');

    await favoriteButton.click();
    expect(new URL(page.url()).pathname).toBe('/productos');

    await expect
      .poll(
        async () =>
          page.evaluate((key) => {
            const value = window.localStorage.getItem(key);
            return value ? JSON.parse(value).length : 0;
          }, FAVORITES_KEY),
        { timeout: 15000 }
      )
      .toBe(1);

    const storedFavorites = await page.evaluate((key) => {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : [];
    }, FAVORITES_KEY);

    expect(storedFavorites).toHaveLength(1);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.goto('/favoritos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Mis favoritos' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole('link', { name: SEE_PRODUCTS_LINK })
    ).toHaveAttribute('href', '/productos');
    await expect
      .poll(
        async () =>
          page.evaluate((key) => {
            const value = window.localStorage.getItem(key);
            return value ? JSON.parse(value).length : 0;
          }, FAVORITES_KEY),
        { timeout: 15_000 }
      )
      .toBe(1);
  });

  test('shows anonymous favorite products in the favorites page', async ({
    page,
  }) => {
    await seedLocalFavorites(page, 'leche-pil-natural-900-ml');
    await page.goto('/favoritos', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Favoritos \| Sansistore/);
    await expect(
      page.getByRole('heading', { name: 'Mis favoritos' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: SEE_PRODUCTS_LINK })
    ).toHaveAttribute('href', '/productos');
    await expect(
      page.getByTestId('favorite-button-leche-pil-natural-900-ml')
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByTestId('favorite-button-leche-pil-natural-900-ml')
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('allows removing a favorite from the favorites page', async ({
    page,
  }) => {
    await seedLocalFavorites(page, 'leche-pil-natural-900-ml');
    await page.goto('/favoritos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Leche PIL Natural 900 ml/)).toBeVisible({
      timeout: 15_000,
    });
    const favoritePageButton = page.getByTestId(
      'favorite-button-leche-pil-natural-900-ml'
    );
    await expect(favoritePageButton).toBeVisible({ timeout: 15_000 });
    await favoritePageButton.click();

    await expect
      .poll(
        async () =>
          page.evaluate((key) => {
            const value = window.localStorage.getItem(key);
            return value ? JSON.parse(value).length : 0;
          }, FAVORITES_KEY),
        { timeout: 15000 }
      )
      .toBe(0);

    await expect(favoritePageButton).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('link', { name: SEE_PRODUCTS_LINK })).toBeVisible();
  });
});
