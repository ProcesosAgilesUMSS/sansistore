import { test, expect, type Page } from '@playwright/test';
import admin from 'firebase-admin';

const CART_KEY = 'sansistore_cart';
const PROJECT_ID = 'sansistore';
const FIRESTORE_TEST_HOSTS = ['127.0.0.1:8080'];

function getTestDb() {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8180';

  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }

  return admin.firestore();
}

function toFirestoreRestFields(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value === null) return [key, { nullValue: 'NULL_VALUE' }];
      if (typeof value === 'boolean') return [key, { booleanValue: value }];
      if (typeof value === 'number') return [key, { doubleValue: value }];
      return [key, { stringValue: String(value) }];
    }),
  );
}

async function mirrorDocumentToDefaultEmulator(
  collectionName: string,
  documentId: string,
  data: Record<string, unknown>,
) {
  const updateMask = Object.keys(data)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&');

  await Promise.all(
    FIRESTORE_TEST_HOSTS.map(async (host) => {
      try {
        await fetch(
          `http://${host}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${documentId}?${updateMask}`,
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ fields: toFirestoreRestFields(data) }),
            signal: AbortSignal.timeout(1000),
          },
        );
      } catch {
        // The local default emulator port is optional; Playwright uses 8180 in CI.
      }
    }),
  );
}

async function createTestProduct({
  productId,
  name,
  price,
  imageUrl = '/product-placeholder.svg',
  stockAvailable = 10,
  active = true,
  inventoryEnabled = true,
}: {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  stockAvailable?: number;
  active?: boolean;
  inventoryEnabled?: boolean;
}) {
  const db = getTestDb();
  const productData = {
    productId,
    categoryId: 'cat-test',
    name,
    slug: productId,
    description: 'Producto aislado para pruebas del carrito.',
    price,
    imageUrl,
    active,
    hasOffer: false,
    offerPrice: null,
    badge: null,
    sourceUrl: 'https://example.test/cart-product',
    createdBy: 'test',
    soldCount: 0,
  };
  const inventoryData = {
    productId,
    stockTotal: Math.max(stockAvailable, 10),
    stockAvailable,
    stockReserved: 0,
    minStock: 1,
    enabled: inventoryEnabled,
  };

  await db.collection('products').doc(productId).set({
    ...productData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('inventory').doc(productId).set({
    ...inventoryData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await mirrorDocumentToDefaultEmulator('products', productId, {
    ...productData,
    createdAt: new Date().toISOString(),
  });
  await mirrorDocumentToDefaultEmulator('inventory', productId, {
    ...inventoryData,
    updatedAt: new Date().toISOString(),
  });
}

async function updateTestProduct(productId: string, data: Record<string, unknown>) {
  await getTestDb().collection('products').doc(productId).update(data);
  await mirrorDocumentToDefaultEmulator('products', productId, data);
}

async function updateTestInventory(productId: string, data: Record<string, unknown>) {
  await getTestDb().collection('inventory').doc(productId).update(data);
  await mirrorDocumentToDefaultEmulator('inventory', productId, data);
}

async function seedLocalCart(
  page: Page,
  productId: string,
  priceAtAdd: number,
) {
  await page.addInitScript(
    ({ cartKey, item }) => {
      window.localStorage.setItem(cartKey, JSON.stringify([item]));
    },
    {
      cartKey: CART_KEY,
      item: {
        productId,
        quantity: 1,
        updatedAt: Date.now(),
        priceAtAdd,
      },
    },
  );
}

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

    await page.goto('/carrito');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible();
    await expect(page.getByText('Bs 9.70 / u')).toBeVisible();
    await expect(page.getByText('Bs 19.40', { exact: true })).toBeVisible();
    await expect(page.getByText('2', { exact: true })).toBeVisible();

    await expect(page.getByText('Galletas Agua Victoria 120 gr')).toBeVisible();
    await expect(page.getByText('Bs 8.00 / u')).toBeVisible();
    await expect(page.getByText('Bs 8.00', { exact: true })).toBeVisible();
    await expect(page.getByText('1', { exact: true })).toBeVisible();
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

    await page.goto('/carrito');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Comprar ahora' })).toBeVisible();
  });

  test('should clear cart when user logs out', async ({ page }) => {
    await page.goto('/login');

    await page
      .getByLabel('Correo electrónico')
      .fill('juan.paredes@est.umss.edu');
    await page.getByLabel('Contraseña').fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/me');

    await page.goto('/carrito');

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible();

    await page.goto('/logout');

    await expect(page).toHaveURL('/login');

    await page.goto('/carrito');

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('should show empty cart after logout and login with different user', async ({
    page,
  }) => {
    await page.goto('/login');

    await page
      .getByLabel('Correo electrónico')
      .fill('juan.paredes@est.umss.edu');
    await page.getByLabel('Contraseña').fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/me');

    await page.goto('/carrito');

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible();

    await page.goto('/logout');

    await expect(page).toHaveURL('/login');

    // Login with carlos
    await page.getByLabel('Correo electrónico').fill('carlos.docente@est.umss.edu');
    await page.getByLabel('Contraseña').fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/me');

    // Navigate to cart and verify it's empty (carlos has no items)
    await page.goto('/carrito');

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('should allow non-logged user to add items to cart', async ({
    page,
  }) => {
    // Add first product (Leche PIL)
    await page.goto('/productos/leche-pil-natural-900-ml');
    await expect(
      page.getByRole('heading', { name: /Leche PIL Natural 900 ml/ })
    ).toBeVisible();
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();

    // Add second product (Detergente)
    await page.goto('/productos/detergente-liquido-ola-futuro-limpieza-completa-5-l');
    await expect(
      page.getByRole('heading', { name: /Detergente Liquido Ola Futuro/ })
    ).toBeVisible();
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();

    // Add third product (Galletas)
    await page.goto('/productos/galletas-agua-victoria-120-gr');
    await expect(
      page.getByRole('heading', { name: /Galletas Agua Victoria 120 gr/ })
    ).toBeVisible();
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();

    // Navigate to cart and verify all 3 products are there with 1 unit each
    await page.goto('/carrito');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible();
    await expect(page.getByText('Detergente Liquido Ola Futuro').first()).toBeVisible();
    await expect(page.getByText('Galletas Agua Victoria 120 gr')).toBeVisible();

    // Verify each product has 1 unit
    const quantities = page.locator('[data-testid*="quantity"]');
    const count = await quantities.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(quantities.nth(i)).toHaveText('1');
      }
    }
  });

  test('should show updated price in real time before confirming', async ({
    page,
  }, testInfo) => {
    const productId = `test-cart-price-${testInfo.workerIndex}-${Date.now()}`;
    const productName = 'Producto prueba precio en vivo';

    await createTestProduct({
      productId,
      name: productName,
      price: 10,
    });
    await seedLocalCart(page, productId, 10);

    await page.goto('/carrito');

    await expect(page.locator('a').filter({ hasText: productName })).toBeVisible();
    await expect(page.getByText('Bs 10.00 / u')).toBeVisible();

    await updateTestProduct(productId, {
      price: 12.5,
    });

    await expect(
      page.getByText('El precio subió de Bs 10.00 a Bs 12.50.'),
    ).toBeVisible();
    await expect(
      page.getByText('1 producto cambió de precio. Revisa el total antes de confirmar.'),
    ).toBeVisible();
  });

  test('should mark product unavailable in real time when stock reaches zero', async ({
    page,
  }, testInfo) => {
    const productId = `test-cart-stock-${testInfo.workerIndex}-${Date.now()}`;
    const productName = 'Producto prueba stock en vivo';

    await createTestProduct({
      productId,
      name: productName,
      price: 8,
      stockAvailable: 5,
    });
    await seedLocalCart(page, productId, 8);

    await page.goto('/carrito');

    await expect(page.locator('a').filter({ hasText: productName })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toBeEnabled();

    await updateTestInventory(productId, {
      stockAvailable: 0,
    });

    await expect(page.getByText('Sin stock disponible.')).toBeVisible();
    await expect(
      page.getByText('Hay 1 producto no disponible. Quítalos para continuar.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toBeDisabled();
  });

  test('should show image fallback in real time when product image breaks', async ({
    page,
  }, testInfo) => {
    const productId = `test-cart-image-${testInfo.workerIndex}-${Date.now()}`;
    const productName = 'Producto prueba imagen rota';

    await createTestProduct({
      productId,
      name: productName,
      price: 6,
      imageUrl: '/product-placeholder.svg',
    });
    await seedLocalCart(page, productId, 6);

    await page.goto('/carrito');

    await expect(page.locator('a').filter({ hasText: productName })).toBeVisible();
    await expect(page.getByTestId(`cart-item-image-${productId}`)).toBeVisible();

    await updateTestProduct(productId, {
      imageUrl: 'http://127.0.0.1:9/no-existe.jpg',
    });

    await expect(page.getByTestId(`cart-item-image-fallback-${productId}`)).toBeVisible();
  });

  
});
