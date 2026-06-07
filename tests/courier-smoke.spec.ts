import { expect, test, type Page } from '@playwright/test';

const acceptedOrderCode = 'pu4-qsc';
const juanOrderCustomer = 'Juan Paredes';
const carlosOrderCustomer = 'Carlos Flores';

async function loginAsCourier(page: Page, email = 'luis.mensajero@est.umss.edu') {
  await page.goto('/login');

  const loginButton = page
    .locator('form')
    .getByRole('button', { name: /Iniciar/ });

  await expect(loginButton).toBeEnabled({ timeout: 15_000 });
  await expect(page.locator('#email')).toBeEditable();
  await expect(page.locator('#password')).toBeEditable();
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const button = document
            .querySelector('form')
            ?.querySelector('button[type="button"]');

          return Boolean(
            button &&
            Object.keys(button).some((key) => key.startsWith('__reactProps'))
          );
        }),
      { timeout: 15_000 }
    )
    .toBe(true);

  await page.locator('#email').fill(email);
  await page.locator('#password').fill('12345678');
  await loginButton.click({ noWaitAfter: true });

  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}

async function selectCourierSection(
  page: Page,
  buttonName: string | RegExp,
  headingName: string | RegExp
) {
  const sectionButton = page.getByRole('button', { name: buttonName });
  const buttonPattern =
    typeof buttonName === 'string'
      ? buttonName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      : buttonName.source;
  const buttonFlags = typeof buttonName === 'string' ? '' : buttonName.flags;

  await expect(sectionButton).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(
      async () =>
        page.evaluate(({ source, flags }) => {
          const pattern = new RegExp(source, flags);
          const button = [...document.querySelectorAll('button')].find((item) =>
            pattern.test(item.textContent ?? '')
          );

          return Boolean(
            button &&
            Object.keys(button).some((key) => key.startsWith('__reactProps'))
          );
        }, { source: buttonPattern, flags: buttonFlags }),
      { timeout: 15_000 }
    )
    .toBe(true);

  await sectionButton.click();
  await expect(page.getByRole('heading', { name: headingName })).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('Courier smoke tests', () => {
  test('shows totals calculated from order items and allowed zone labels', async ({
    page,
  }) => {
    await loginAsCourier(page);
    await page.goto('/courier');
    await selectCourierSection(page, 'Pedidos aceptados', 'Pedidos aceptados');

    const assignedOrder = page
      .locator('article')
      .filter({ hasText: acceptedOrderCode });
    await expect(assignedOrder).toBeVisible({ timeout: 15_000 });
    await expect(
      assignedOrder.getByText('1x Detergente Liquido Ola Futuro Limpieza Completa 5 L')
    ).toBeVisible();
    await expect(assignedOrder.getByText('10x Leche PIL Natural 900 ml')).toBeVisible();
    await expect(assignedOrder.getByText('Cancha principal FCyT')).toBeVisible();
  });

  test('shows each courier order in only one active section', async ({ page }) => {
    await loginAsCourier(page);
    await page.goto('/courier');

    await selectCourierSection(page, /Gesti.*n Entregas/, /Gesti.*n Entregas/);
    await expect(
      page.locator('article').filter({ hasText: acceptedOrderCode })
    ).toHaveCount(0);

    await selectCourierSection(page, 'Pedidos aceptados', 'Pedidos aceptados');
    await expect(
      page.locator('article').filter({ hasText: acceptedOrderCode })
    ).toHaveCount(1);
  });

  test('opens buyer location in the internal Leaflet map', async ({ page }) => {
    await loginAsCourier(page);
    await page.goto('/courier');
    await selectCourierSection(page, 'Pedidos aceptados', 'Pedidos aceptados');

    const assignedOrder = page
      .locator('article')
      .filter({ hasText: juanOrderCustomer });
    await expect(assignedOrder).toBeVisible({ timeout: 15_000 });

    const mapLink = assignedOrder.getByRole('link', { name: 'Abrir Maps' });
    await expect(mapLink).toHaveAttribute(
      'href',
      /\/mapa\?lat=-17\.395102&lng=-66\.145782&order=[^&]+$/
    );
    await mapLink.click();

    await expect(page).toHaveURL(
      /\/mapa\?lat=-17\.395102&lng=-66\.145782&order=[^&]+$/
    );
    await expect(page.getByText('1x Detergente Liquido Ola Futuro Limpieza Completa 5 L')).toBeVisible();
    await expect(page.getByText('10x Leche PIL Natural 900 ml')).toBeVisible();
  });

  test('requires confirmation before accepting an assigned order', async ({
    page,
  }) => {
    await loginAsCourier(page, 'nadia.mensajero@est.umss.edu');
    await page.goto('/courier');

    const assignedOrder = page
      .locator('article')
      .filter({ hasText: carlosOrderCustomer });
    await expect(assignedOrder).toBeVisible({ timeout: 15_000 });

    await assignedOrder.getByRole('button', { name: 'Aceptar pedido' }).click();

    const confirmationDialog = page.getByRole('dialog', {
      name: 'Aceptar pedido asignado',
    });
    await expect(confirmationDialog).toBeVisible();
    await expect(assignedOrder).toBeVisible();

    await confirmationDialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(confirmationDialog).toBeHidden();
    await expect(assignedOrder).toBeVisible();
  });
});
