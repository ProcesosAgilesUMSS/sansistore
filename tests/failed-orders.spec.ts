import { expect, test, type Page } from '@playwright/test';

/**
 * E2E de la HU "Identificar pedidos con fallos".
 * Datos sembrados por el seed (tests/global-setup.ts):
 *  - Super usuario Marko (marko@umss.edu) con todos los roles.
 *  - Pedidos fallidos de ejemplo (Ana / Cliente ausente, Carlos / Falta de pago,
 *    Juan / Direccion incorrecta).
 */

async function login(page: Page, email: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const loginButton = page
    .locator('form')
    .getByRole('button', { name: /Iniciar/ });
  const emailField = page.getByLabel('Correo electrónico');
  const passwordField = page.locator('#password');

  await expect(loginButton).toBeEnabled({ timeout: 15_000 });
  await expect(emailField).toBeEditable();
  await expect(passwordField).toBeEditable();
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
        } catch {
          return false;
        }
      },
      { timeout: 15_000 }
    )
    .toBe(true);

  // Hasta que React no hidrata, el primer fill puede perderse y el click
  // del boton no dispara el submit. Reintentamos rellenar + enviar (acciones
  // idempotentes) hasta que la pagina deje de estar en /login.
  await expect(async () => {
    await emailField.fill(email);
    await passwordField.fill('12345678');
    await expect(emailField).toHaveValue(email);
    await expect(passwordField).toHaveValue('12345678');
    await loginButton.click({ noWaitAfter: true });
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
  }).toPass({ timeout: 40_000 });
}

test.describe('Pedidos con fallos', () => {
  // Firefox/WebKit en Docker tardan mas en hidratar; damos margen al login.
  test.describe.configure({ mode: 'serial', timeout: 60_000 });

  test('el operador ve la lista de pedidos con fallos y su motivo', async ({
    page,
  }) => {
    await login(page, 'marko@umss.edu');
    await page.goto('/inventory/incidents', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /Pedidos con/ })
    ).toBeVisible({ timeout: 15_000 });

    // Pedidos sembrados con sus motivos.
    const anaCard = page.locator('button').filter({ hasText: 'Ana Mamani' });
    await expect(anaCard.first()).toBeVisible({ timeout: 15_000 });
    await expect(anaCard.first()).toContainText('Cliente ausente');

    await expect(
      page.locator('button').filter({ hasText: 'Carlos Flores' }).first()
    ).toContainText('Falta de pago del cliente');

    await expect(
      page.locator('button').filter({ hasText: 'Juan Paredes' }).first()
    ).toContainText('Direccion incorrecta');

    // Tipos de fallo presentes.
    await expect(page.getByText('NO ENTREGADO').first()).toBeVisible();
    await expect(page.getByText('CANCELADO').first()).toBeVisible();
  });

  test('un comprador sin rol no puede entrar al panel', async ({ page }) => {
    await login(page, 'ana.comprador@est.umss.edu');
    await page.goto('/inventory/incidents', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Acceso denegado')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole('heading', { name: /Pedidos con/ })
    ).toHaveCount(0);
  });

  test('al abrir un pedido se ven el motivo y los productos', async ({
    page,
  }) => {
    await login(page, 'marko@umss.edu');
    await page.goto('/inventory/incidents', { waitUntil: 'domcontentloaded' });

    await page
      .locator('button')
      .filter({ hasText: 'Ana Mamani' })
      .first()
      .click();

    // Acotamos los asserts al modal para no chocar con la tarjeta de la lista.
    const modal = page.locator('section', {
      has: page.getByRole('heading', { name: 'Pedido fallido' }),
    });
    await expect(modal).toBeVisible({ timeout: 15_000 });

    // Motivo del fallo.
    await expect(modal.getByText('Cliente ausente', { exact: true })).toBeVisible();
    // Productos del pedido (Leche PIL x2, Galletas Victoria x3).
    await expect(modal.getByText(/Leche PIL/)).toBeVisible();
    await expect(modal.getByText('x2', { exact: true })).toBeVisible();
    await expect(modal.getByText('x3', { exact: true })).toBeVisible();
  });

  test('reponer el stock marca el pedido y no se puede repetir', async ({
    page,
  }, testInfo) => {
    await login(page, 'marko@umss.edu');
    await page.goto('/inventory/incidents', { waitUntil: 'domcontentloaded' });

    // Cada navegador usa su pedido dedicado: la reposicion persiste en la DB
    // compartida, asi evitamos que un proyecto deshabilite al otro.
    const customerByProject: Record<string, string> = {
      chromium: 'Restore Chromium',
      firefox: 'Restore Firefox',
      webkit: 'Restore Webkit',
    };
    const customer = customerByProject[testInfo.project.name] ?? 'Restore Chromium';

    const card = page.locator('button').filter({ hasText: customer }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click();

    const restoreButton = page.getByRole('button', { name: /Reponer stock/ });
    await expect(restoreButton).toBeEnabled({ timeout: 15_000 });
    await restoreButton.click();

    // Tras reponer, el modal indica que el stock ya fue repuesto
    // y el boton queda deshabilitado (no se puede repetir).
    await expect(
      page.getByText('El stock de este pedido ya fue repuesto.')
    ).toBeVisible({ timeout: 15_000 });
    await expect(restoreButton).toBeDisabled();
  });
});
