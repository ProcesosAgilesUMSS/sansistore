// tests/profile.spec.ts
import { test, expect, type Page } from '@playwright/test';

test.describe('Perfil de Usuario', () => {
  // ===== CONSTANTES DE USUARIOS =====
  const USERS = {
    SUPER: 'marko@umss.edu',
    DEFAULT: 'juan.paredes@est.umss.edu',
  };

  // ===== HELPERS REUTILIZABLES =====
  
  async function loginAsUser(page: Page, email: string = USERS.DEFAULT) {
    await page.goto('/login');
    await waitForLoginForm(page);
    
    const { emailField, passwordField } = await fillLoginCredentials(page, email);
    
    const loginButton = page
      .locator('form')
      .getByRole('button', { name: 'Iniciar sesión', exact: true });
    
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!page.url().includes('/login')) break;
      try {
        await loginButton.click({ noWaitAfter: true, timeout: 2000 });
      } catch (error) {
        if (!page.url().includes('/login')) break;
      }
      await page.waitForTimeout(1000);
    }
    
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  }

  async function waitForLoginForm(page: Page) {
    const loginButton = page.locator('form').getByRole('button', {
      name: 'Iniciar sesión',
      exact: true,
    });

    await expect(loginButton).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByLabel('Correo electrónico')).toBeEditable();
    await expect(page.locator('#password')).toBeEditable();
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
          } catch (e) {
            return false;
          }
        },
        { timeout: 15_000 }
      )
      .toBe(true);
  }

  async function fillLoginCredentials(page: Page, email: string) {
    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.locator('#password');

    for (let attempt = 0; attempt < 3; attempt++) {
      await emailField.fill(email);
      await passwordField.fill('12345678');
      await page.waitForTimeout(250);

      if (
        (await emailField.inputValue()) === email &&
        (await passwordField.inputValue()) === '12345678'
      ) {
        return { emailField, passwordField };
      }
    }

    await expect(emailField).toHaveValue(email, { timeout: 10_000 });
    await expect(passwordField).toHaveValue('12345678', { timeout: 10_000 });
    return { emailField, passwordField };
  }

  async function waitForProfileHydration(page: Page) {
    await expect
      .poll(
        async () => {
          try {
            return await page.evaluate(() => {
              const elements = document.querySelectorAll(
                'button[aria-label="Editar teléfono"], section.bg-card-bg-light'
              );
              for (const el of elements) {
                if (Object.keys(el).some(key => key.startsWith('__reactProps'))) {
                  return true;
                }
              }
              return false;
            });
          } catch (e) {
            return false;
          }
        },
        { timeout: 15_000 }
      )
      .toBe(true);
  }

  async function waitForReactProps(page: Page, selector: string) {
    await expect
      .poll(
        async () => {
          try {
            return await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              return el && Object.keys(el).some(key => key.startsWith('__reactProps'));
            }, selector);
          } catch (e) {
            return false;
          }
        },
        { timeout: 10_000 }
      )
      .toBe(true);
  }

  // ===== TESTS =====

  test.describe('Control de Acceso', () => {
    test('bloquea usuarios no autenticados en /me', async ({ page }) => {
      await page.goto('/me', { waitUntil: 'domcontentloaded' });

      // Verificar mensaje "No autenticado"
      await expect(page.getByText('No autenticado')).toBeVisible({
        timeout: 15_000,
      });

      // ✅ CORREGIDO: Usar el botón específico del main (no el del navbar)
      await expect(
        page.locator('main').getByRole('link', { name: 'Iniciar sesión' })
      ).toBeVisible();
    });

    test('carga información de cuenta tras login', async ({ page }) => {
      test.setTimeout(60_000);

      await loginAsUser(page, USERS.DEFAULT);
      await page.goto('/me');
      await waitForProfileHydration(page);

      await expect(
        page.locator('dd', { hasText: USERS.DEFAULT })
      ).toBeVisible({ timeout: 15_000 });
      
      await expect(page.getByText('No autenticado')).toBeHidden({
        timeout: 15_000,
      });
    });
  });

  test.describe('Edición Inline', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60_000);
      await loginAsUser(page, USERS.DEFAULT);
      await page.goto('/me');
      await waitForProfileHydration(page);
    });

    test('permite editar y guardar teléfono y email de respaldo', async ({ page }) => {
      // 1. Editar Teléfono
      const editPhoneButton = page.locator('button[aria-label="Editar teléfono"]');
      await expect(editPhoneButton).toBeVisible({ timeout: 10_000 });
      await waitForReactProps(page, 'button[aria-label="Editar teléfono"]');
      await editPhoneButton.click();

      const phoneInput = page.locator('input[placeholder="Ej. 71234567"]');
      await expect(phoneInput).toBeEditable({ timeout: 10_000 });

      const testPhone = '71234567';
      await phoneInput.clear();
      await phoneInput.fill(testPhone);

      const confirmPhoneButton = page.locator('button[aria-label="Confirmar teléfono"]');
      await confirmPhoneButton.click();

      // 2. Editar Correo de Respaldo
      const editMailButton = page.locator('button[aria-label="Editar correo de respaldo"]');
      await expect(editMailButton).toBeVisible({ timeout: 10_000 });
      await waitForReactProps(page, 'button[aria-label="Editar correo de respaldo"]');
      await editMailButton.click();

      const mailInput = page.locator('input[placeholder="ejemplo@correo.com"]');
      await expect(mailInput).toBeEditable({ timeout: 10_000 });

      const testBackupEmail = 'backup@test.com';
      await mailInput.clear();
      await mailInput.fill(testBackupEmail);

      const confirmMailButton = page.locator('button[aria-label="Confirmar correo"]');
      await confirmMailButton.click();

      // ✅ CORREGIDO: Esperar el toast de éxito
      await expect(page.locator('text="Teléfono celular actualizado correctamente"')).toBeVisible({
        timeout: 10_000,
      });

      // Verificar que los valores se actualizaron
      await expect(
        page.locator('section.bg-card-bg-light').locator('span', { hasText: testPhone })
      ).toBeVisible();
      await expect(
        page.locator('section.bg-card-bg-light').locator('span', { hasText: testBackupEmail })
      ).toBeVisible();
    });

    test('persiste los cambios al recargar la página', async ({ page }) => {
      const testPhone = '76543210';
      const testBackupEmail = 'persist@test.com';

      // 1. Editar y guardar teléfono
      const editPhoneButton = page.locator('button[aria-label="Editar teléfono"]');
      await expect(editPhoneButton).toBeVisible({ timeout: 10_000 });
      await waitForReactProps(page, 'button[aria-label="Editar teléfono"]');
      await editPhoneButton.click();

      const phoneInput = page.locator('input[placeholder="Ej. 71234567"]');
      await expect(phoneInput).toBeEditable({ timeout: 10_000 });
      await phoneInput.clear();
      await phoneInput.fill(testPhone);
      await page.locator('button[aria-label="Confirmar teléfono"]').click();

      // 2. Editar y guardar correo
      const editMailButton = page.locator('button[aria-label="Editar correo de respaldo"]');
      await expect(editMailButton).toBeVisible({ timeout: 10_000 });
      await waitForReactProps(page, 'button[aria-label="Editar correo de respaldo"]');
      await editMailButton.click();

      const mailInput = page.locator('input[placeholder="ejemplo@correo.com"]');
      await expect(mailInput).toBeEditable({ timeout: 10_000 });
      await mailInput.clear();
      await mailInput.fill(testBackupEmail);
      await page.locator('button[aria-label="Confirmar correo"]').click();

      await expect(page.locator('text="Teléfono celular actualizado correctamente"')).toBeVisible({
        timeout: 10_000,
      });

      // ✅ CORREGIDO: Esperar a que Firestore guarde los datos
      await page.waitForTimeout(2000);

      // 3. Recargar página
      await page.reload();
      await waitForProfileHydration(page);

      // 4. Verificar que los cambios persisten
      await expect(
        page.locator('section.bg-card-bg-light').locator('span', { hasText: testPhone })
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.locator('section.bg-card-bg-light').locator('span', { hasText: testBackupEmail })
      ).toBeVisible({ timeout: 10_000 });
    });

    test('valida formatos incorrectos', async ({ page }) => {
      const editPhoneButton = page.locator('button[aria-label="Editar teléfono"]');
      await expect(editPhoneButton).toBeVisible({ timeout: 10_000 });
      await waitForReactProps(page, 'button[aria-label="Editar teléfono"]');
      await editPhoneButton.click();

      const phoneInput = page.locator('input[placeholder="Ej. 71234567"]');
      await expect(phoneInput).toBeEditable({ timeout: 10_000 });
      
      await phoneInput.clear();
      await phoneInput.fill('123');
      
      await page.locator('button[aria-label="Confirmar teléfono"]').click();

      await expect(page.locator('text="Debe tener 8 dígitos e iniciar con 6 o 7."')).toBeVisible({
        timeout: 5_000,
      });

      const editMailButton = page.locator('button[aria-label="Editar correo de respaldo"]');
      await expect(editMailButton).toBeVisible({ timeout: 10_000 });
      await waitForReactProps(page, 'button[aria-label="Editar correo de respaldo"]');
      await editMailButton.click();

      const mailInput = page.locator('input[placeholder="ejemplo@correo.com"]');
      await expect(mailInput).toBeEditable({ timeout: 10_000 });
      
      await mailInput.clear();
      await mailInput.fill('invalid-email');
      
      await page.locator('button[aria-label="Confirmar correo"]').click();

      await expect(page.locator('text="Formato de correo electrónico inválido."')).toBeVisible({
        timeout: 5_000,
      });

      await expect(phoneInput).toBeEditable();
    });
  });

  test.describe('Control de Visibilidad por Roles', () => {
    test('super usuario (MARKO) ve todas las secciones', async ({ page }) => {
      test.setTimeout(60_000);
      
      await loginAsUser(page, USERS.SUPER);
      await page.goto('/me');
      await waitForProfileHydration(page);

      // ✅ CORREGIDO: Usar el selector del footer (el que está en el main)
      // El footer tiene los enlaces con la clase 'flex items-center gap-3'
      await expect(
        page.locator('footer a[href="/location"]').filter({ hasText: 'Mis direcciones' })
      ).toBeVisible({ timeout: 10_000 });
      
      await expect(
        page.locator('footer a[href="/mis-pedidos"]').filter({ hasText: 'Mis pedidos' })
      ).toBeVisible({ timeout: 10_000 });

      // ✅ CORREGIDO: Verificar la sección de Gestión de Compras
      await expect(
        page.locator('h4', { hasText: 'Mis pedidos y devoluciones' })
      ).toBeVisible({ timeout: 10_000 });

      // Verificar calificación de mensajero
      await expect(
        page.locator('div', { hasText: /Calificación: \d+\.\d+ \/ 5.0/ })
      ).toBeVisible({ timeout: 10_000 });
    });

    test('usuario normal ve solo secciones permitidas', async ({ page }) => {
      test.setTimeout(60_000);
      
      await loginAsUser(page, USERS.DEFAULT);
      await page.goto('/me');
      await waitForProfileHydration(page);

      // ✅ CORREGIDO: Usar el selector del footer
      await expect(
        page.locator('footer a[href="/location"]').filter({ hasText: 'Mis direcciones' })
      ).toBeVisible({ timeout: 10_000 });

      // NO debe ver la calificación de mensajero
      await expect(
        page.locator('div', { hasText: /Calificación: \d+\.\d+ \/ 5.0/ })
      ).toBeHidden({ timeout: 5_000 });
    });
  });

  test.describe('Validaciones Avanzadas de Edición', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60_000);
      await loginAsUser(page, USERS.DEFAULT);
      await page.goto('/me');
      await waitForProfileHydration(page);
    });

    test('teléfono vacío muestra error obligatorio', async ({ page }) => {
      const editPhoneButton = page.locator('button[aria-label="Editar teléfono"]');
      await expect(editPhoneButton).toBeVisible({ timeout: 10_000 });
      await waitForReactProps(page, 'button[aria-label="Editar teléfono"]');
      await editPhoneButton.click();

      const phoneInput = page.locator('input[placeholder="Ej. 71234567"]');
      await expect(phoneInput).toBeEditable({ timeout: 10_000 });
      
      await phoneInput.clear();
      
      await page.locator('button[aria-label="Confirmar teléfono"]').click();

      await expect(page.locator('text="El teléfono celular es obligatorio."')).toBeVisible({
        timeout: 5_000,
      });
    });

    test('correo de respaldo con más de 100 caracteres muestra error', async ({ page }) => {
      const editMailButton = page.locator('button[aria-label="Editar correo de respaldo"]');
      await expect(editMailButton).toBeVisible({ timeout: 10_000 });
      await waitForReactProps(page, 'button[aria-label="Editar correo de respaldo"]');
      await editMailButton.click();

      const mailInput = page.locator('input[placeholder="ejemplo@correo.com"]');
      await expect(mailInput).toBeEditable({ timeout: 10_000 });
      
      const longEmail = 'a'.repeat(100) + '@test.com';
      await mailInput.clear();
      await mailInput.fill(longEmail);
      
      await page.locator('button[aria-label="Confirmar correo"]').click();

      await expect(page.locator('text="El correo no puede exceder los 100 caracteres."')).toBeVisible({
        timeout: 5_000,
      });
    });
  });
});