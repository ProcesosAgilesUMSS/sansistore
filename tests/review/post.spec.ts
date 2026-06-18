import { test, expect, defineConfig } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.afterEach(async ({ page }, testInfo) => {
  if (true) {
    const screenshot = await page.screenshot({ fullPage: true });

    await testInfo.attach('full-page-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
});

export default defineConfig({
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  use: {
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
});

test.describe('Post and Manage Reviews', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.waitForReady();
    await login.fillCredentials('juan.paredes@est.umss.edu');
    await login.loginButton.click();
    await expect(page).not.toHaveURL(/.*\/login/);
  });

  const testProductUrl = '/productos/mocochinchi-soproma-100-gr';

  test('should manage the lifecycle of a product review', async ({ page }) => {
    await page.goto(testProductUrl);
    
    const userOpinionContainer = page.locator('div.rounded-\\[2rem\\]', { hasText: 'Tu opinión' });
    await expect(userOpinionContainer).toBeVisible();

    const isFormVisible = await userOpinionContainer.getByText('Publicar comentario').isVisible();
    const optionsButton = userOpinionContainer.locator('button.opacity-50.transition-colors');

    if (!isFormVisible) {
      await optionsButton.click();
      await page.locator('.absolute.right-0').getByRole('button', { name: 'Eliminar' }).click();
      await page.locator('.fixed.inset-0').getByRole('button', { name: 'Eliminar' }).click();
      await expect(userOpinionContainer.getByText('Publicar comentario')).toBeVisible();
    }

    const form = userOpinionContainer.locator('form').filter({ hasText: 'Publicar comentario' });
    
    const publishStars = form.locator('button[type="button"]');
    await publishStars.nth(2).click();

    const commentField = form.locator('#comment');
    await expect(commentField).toBeEditable();
    await commentField.fill('Producto de calidad regular, cumple su función.');

    await page.getByRole('button', { name: 'Publicar comentario' }).click();

    await expect(userOpinionContainer.getByText('Producto de calidad regular, cumple su función.')).toBeVisible();
    await expect(userOpinionContainer.getByText('Juan Paredes')).toBeVisible();
    await expect(form).not.toBeVisible();
    await optionsButton.click();
    await page.getByRole('button', { name: 'Editar' }).click();

    const editForm = userOpinionContainer.locator('form').filter({ hasText: 'Guardar' });
    await expect(editForm).toBeVisible();

    const editStars = editForm.locator('button[type="button"]');
    await editStars.nth(4).click(); // 5ta estrella (index 4)

    const editCommentField = editForm.locator('textarea');
    await editCommentField.clear();
    await editCommentField.fill('Producto excelente, superó mis expectativas.');

    await page.getByRole('button', { name: 'Guardar' }).click();

    await expect(userOpinionContainer.getByText('Producto excelente, superó mis expectativas.')).toBeVisible();
    await expect(editForm).not.toBeVisible();

    await optionsButton.click();
    await page.locator('.absolute.right-0').getByRole('button', { name: 'Eliminar' }).click();
    
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Eliminar' }).click();

    await expect(userOpinionContainer.getByText('Producto excelente, superó mis expectativas.')).not.toBeVisible();

    await expect(userOpinionContainer.getByText('Publicar comentario')).toBeVisible();
  });
});

