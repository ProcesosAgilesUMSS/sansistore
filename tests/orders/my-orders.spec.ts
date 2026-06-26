import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

const ANA_EMAIL = 'ana.comprador@est.umss.edu';

test.describe('Mis pedidos - comprador (Ana Mamani)', () => {
  test.describe.configure({ mode: 'serial', timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.waitForReady();
    // ponytail: toPass retries fill+click+URL hasta salir de /login.
    await expect(async () => {
      await login.fillCredentials(ANA_EMAIL);
      await login.loginButton.click({ noWaitAfter: true });
      await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
    }).toPass({ timeout: 40_000 });
    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  });

  test('el menu lleva a Mi Perfil y de ahi a Mis pedidos', async ({ page }) => {
    await page.goto('/mi-perfil', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(?:me|mi-perfil)$/);
    const link = page
      .getByRole('link', { name: /Mis pedidos/ })
      .filter({ hasText: 'Ver mis compras' });
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(page).toHaveURL(/\/mis-pedidos$/);
  });

  test('muestra el encabezado y las tarjetas de pedidos de Ana', async ({
    page,
  }) => {
    await page.goto('/mis-pedidos', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Mis pedidos y devoluciones' }).or(
        page.getByRole('heading', { name: 'Mis pedidos' })
      )
    ).toBeVisible({ timeout: 15_000 });
    const failed = page.locator(
      'a[href="/mis-pedidos/019e74a6-0001-7000-aaaa-000000000001_fail-001"]'
    );
    await expect(failed).toBeVisible({ timeout: 15_000 });
    await expect(failed).toContainText('No entregado');
    await expect(failed).toContainText('Aula 692A - Edificio Académico 2 FCyT');
    await expect(
      page.locator(
        'a[href="/mis-pedidos/019e74a5-808a-7321-9127-281f098b2d8e_3dg-zjs"]'
      )
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator(
        'a[href="/mis-pedidos/0019e74a4-a470-722f-a0cc-04f8e08a4e8d_io7-6uj"]'
      )
    ).toBeVisible({ timeout: 15_000 });
  });
});
