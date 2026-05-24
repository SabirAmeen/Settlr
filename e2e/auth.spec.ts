import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should set up a PIN and then login with it', async ({ page }) => {
    // 1. Verify we are on the setup screen
    await expect(page.getByText('Secure Your App')).toBeVisible();
    
    // 2. Click "Set up PIN Code"
    await page.getByRole('button', { name: 'Set up PIN Code' }).click();
    
    // 3. Enter a PIN
    const pin = '1234';
    await page.getByPlaceholder('Enter New PIN').fill(pin);
    await page.getByRole('button', { name: 'Save PIN' }).click();
    
    // 4. Verify we are logged in and see the dashboard
    await expect(page.getByText('Net Balance')).toBeVisible();
    
    // 5. Reload the page to trigger the lock screen
    await page.reload();
    
    // 6. Verify the lock screen is visible
    await expect(page.getByText('Unlock Settlr')).toBeVisible();
    
    // 7. Enter the wrong PIN first
    await page.getByPlaceholder('Enter PIN').fill('0000');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByText('Incorrect PIN')).toBeVisible();
    
    // 8. Enter the correct PIN
    await page.getByPlaceholder('Enter PIN').fill(pin);
    await page.getByRole('button', { name: 'Unlock' }).click();
    
    // 9. Verify we are back on the dashboard
    await expect(page.getByText('Net Balance')).toBeVisible();
  });

  test('should show security warning if not on HTTPS (simulated)', async ({ page }) => {
    // Simulate non-secure context by setting window.isSecureContext to false
    await page.addInitScript(() => {
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        configurable: true
      });
    });
    await page.reload();
    await expect(page.getByText('HTTPS is required for Biometrics')).toBeVisible();
  });
});

