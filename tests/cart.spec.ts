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

async function seedUserCartItem({
  userId,
  productId,
  quantity = 1,
  priceAtAdd,
}: {
  userId: string;
  productId: string;
  quantity?: number;
  priceAtAdd?: number;
}) {
  const cartItemId = `cart-${userId}-${productId}`;
  const payload: Record<string, unknown> = {
    cartItemId,
    userId,
    productId,
    quantity,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (typeof priceAtAdd === 'number') {
    payload.priceAtAdd = priceAtAdd;
  }

  await getTestDb()
    .collection('users')
    .doc(userId)
    .collection('cartItems')
    .doc(cartItemId)
    .set(payload);

  await mirrorDocumentToDefaultEmulator(`users/${userId}/cartItems`, cartItemId, {
    cartItemId,
    userId,
    productId,
    quantity,
    updatedAt: new Date().toISOString(),
    ...(typeof priceAtAdd === 'number' ? { priceAtAdd } : {}),
  });
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

async function setLocalCartOnce(
  page: Page,
  productId: string,
  priceAtAdd: number,
) {
  await page.evaluate(
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
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  async function loginWithEmail(page: Page, email: string) {
    await page.goto('/login');
    await expect(
      page.locator('form').getByRole('button', {
        name: 'Iniciar sesión',
        exact: true,
      })
    ).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByLabel('Correo electrónico')).toBeEditable();
    await expect(page.locator('#password')).toBeEditable();
    await page.waitForLoadState('networkidle');

    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.locator('#password');

    // Fill right before clicking to minimize autofill interference window
    await emailField.fill(email);
    await passwordField.fill('password123');

    // Retry if autofill overwrites the values
    for (let attempt = 0; attempt < 3; attempt++) {
      const currentEmail = await emailField.inputValue();
      const currentPass = await passwordField.inputValue();
      if (currentEmail === email && currentPass === 'password123') break;
      await emailField.fill(email);
      await passwordField.fill('password123');
      await page.waitForTimeout(150);
    }

    await page
      .locator('form')
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await expect(page).toHaveURL('/me', { timeout: 30_000 });
  }


  async function expectCartPage(page: Page) {
    await expect(page).toHaveTitle(/Mi Carrito \| SansiStore/);
  }

  async function expectFilledCartPage(page: Page) {
    await expectCartPage(page);
    const productsHeading = page.getByRole('heading', { name: /Productos \(/ });
    try {
      await expect(productsHeading).toBeVisible({ timeout: 15_000 });
    } catch {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(productsHeading).toBeVisible({ timeout: 15_000 });
    }
  }

  test('should display cart items when user is authenticated', async ({
    page,
  }) => {
    await loginWithEmail(page, 'juan.paredes@est.umss.edu');
    await setLocalCartOnce(page, 'leche-pil-natural-900-ml', 9.7);

    await page.goto('/carrito');
    await expectFilledCartPage(page);

    await expect(page.locator('a[href="/productos/leche-pil-natural-900-ml"]').filter({ hasText: 'Leche PIL Natural 900 ml' }).first()).toBeVisible();
    await expect(page.getByText(/Bs\s(9\.70|12\.50)\s*\/ u/).first()).toBeVisible();
  });

  test('should show empty cart message when user has no items', async ({
    page,
  }) => {
    await loginWithEmail(page, 'carlos.docente@est.umss.edu');

    await page.goto('/carrito');
    await expectCartPage(page);
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
    await expect(page.getByRole('link', { name: /Comprar ahora/ })).toBeVisible();
  });

  test('should clear cart when user logs out', async ({ page }) => {
    await page.goto('/productos/leche-pil-natural-900-ml');
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await expect(page.getByLabel(/Carrito, [^0]/)).toBeVisible({ timeout: 10_000 });

    await page.goto('/carrito');
    await expectFilledCartPage(page);
    await expect(
      page.locator('a[href="/productos/leche-pil-natural-900-ml"]').filter({ hasText: 'Leche PIL Natural 900 ml' }).first()
    ).toBeVisible({ timeout: 15_000 });

    await page.goto('/logout');

    await expect(page).toHaveURL('/login');
    await page.goto('/me');
    await expect(page.getByText('No autenticado')).toBeVisible();

    await page.goto('/carrito');

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('should show empty cart after logout and login with different user', async ({
    page,
  }) => {
    await loginWithEmail(page, 'juan.paredes@est.umss.edu');

    await page.goto('/carrito');
    await expect(page.locator('a[href="/productos/leche-pil-natural-900-ml"]').filter({ hasText: 'Leche PIL Natural 900 ml' }).first()).toBeVisible();

    await page.goto('/logout');

    await expect(page).toHaveURL('/login');

    await loginWithEmail(page, 'carlos.docente@est.umss.edu');

    await page.goto('/carrito');
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('should allow non-logged user to add items to cart', async ({
    page,
  }) => {
    await page.goto('/productos/leche-pil-natural-900-ml');
    await expect(
      page.locator('h1').filter({ hasText: 'Leche PIL Natural 900 ml' })
    ).toBeVisible();
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();

    await page.goto('/carrito');
    await expectFilledCartPage(page);
    await expect(page.locator('a').filter({ hasText: 'Leche PIL Natural 900 ml' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Carrito, 1 unidades/ })).toBeVisible();
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

    await expect(page.locator(`a[href="/productos/${productId}"]`).filter({ hasText: productName }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Bs 10.00 / u').first()).toBeVisible();

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

    await expect(page.locator(`a[href="/productos/${productId}"]`).filter({ hasText: productName }).first()).toBeVisible({ timeout: 15_000 });
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

    await expect(page.locator(`a[href="/productos/${productId}"]`).filter({ hasText: productName }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`cart-item-image-${productId}`)).toBeVisible();

    await updateTestProduct(productId, {
      imageUrl: '',
    });

    await expect(page.getByTestId(`cart-item-image-fallback-${productId}`)).toBeVisible();
  });
});
