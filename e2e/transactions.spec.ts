import { test, expect } from '@playwright/test';

test.describe('Transactions Management', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Clear state robustly
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Set up PIN code (since the app starts fresh)
    await page.getByRole('button', { name: 'Set up PIN Code' }).click();
    await page.getByPlaceholder('Enter New PIN').fill('1234');
    await page.getByRole('button', { name: 'Save PIN' }).click();

    // 3. Confirm we are on the dashboard
    await expect(page.getByText('Net Balance')).toBeVisible();
  });

  test('should add a new record (transaction)', async ({ page }) => {
    // Click the floating action button to open the form
    await page.locator('button.fixed').click();

    // Verify form title
    await expect(page.getByRole('heading', { name: 'Add Transaction' })).toBeVisible();

    // Set transaction details (scoped to the form container)
    const form = page.locator('form');
    await form.getByRole('button', { name: 'Owed to me' }).click();
    await page.getByPlaceholder('0').fill('1500');
    await page.getByPlaceholder('E.g. John Doe').fill('Sabir Ameen');
    await page.getByPlaceholder('What was this for?').fill('Lunch together');

    // Submit form
    await form.getByRole('button', { name: 'Add Record' }).click();

    // Assert that the transaction is displayed in the list with correct details
    await expect(page.getByText('Sabir Ameen')).toBeVisible();
    await expect(page.getByText('Lunch together')).toBeVisible();
    await expect(page.getByText('+₹1,500')).toBeVisible();

    // Verify net balance on the dashboard updates correctly
    await expect(page.locator('.text-4xl.font-bold').getByText('₹1,500')).toBeVisible();
  });

  test('should edit an existing record (single-entry)', async ({ page }) => {
    // 1. Add a transaction first
    await page.locator('button.fixed').click();
    await page.getByPlaceholder('0').fill('1000');
    await page.getByPlaceholder('E.g. John Doe').fill('John Doe');
    await page.getByPlaceholder('What was this for?').fill('Coffee');
    await page.getByRole('button', { name: 'Add Record' }).click();
    
    // Verify it is added
    await expect(page.getByText('John Doe')).toBeVisible();

    // Scope to the specific transaction item row
    const transactionRow = page.locator('.glass', { hasText: 'John Doe' }).first();
    
    // Click Edit button
    await transactionRow.locator('button[title="Edit"]').click();

    // Verify Edit form is open
    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible();

    // Change type to "I Owe" (scoped to the form), edit details, and add the required change reason
    const form = page.locator('form');
    await form.getByRole('button', { name: 'I Owe' }).click();
    await page.getByPlaceholder('0').fill('800');
    await page.getByPlaceholder('What was this for?').fill('Latte and Donut');
    await page.getByPlaceholder('Why are you editing this record?').fill('Corrected price and item');

    // Click Update Record
    await form.getByRole('button', { name: 'Update Record' }).click();

    // Verify updates are reflected
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Latte and Donut')).toBeVisible();
    await expect(page.getByText('-₹800')).toBeVisible();

    // View logs and check history entry
    await transactionRow.locator('button[title="View Logs"]').click();
    await expect(page.getByText('Corrected price and item')).toBeVisible();
    await expect(page.getByText('Prior Total: +₹1,000')).toBeVisible();
  });

  test('should add new entries (sub-entries) to a record and disable direct editing', async ({ page }) => {
    // 1. Add initial transaction
    await page.locator('button.fixed').click();
    await page.getByPlaceholder('0').fill('2000');
    await page.getByPlaceholder('E.g. John Doe').fill('Alice Smith');
    await page.getByPlaceholder('What was this for?').fill('Rent share');
    await page.getByRole('button', { name: 'Add Record' }).click();

    const transactionRow = page.locator('.glass', { hasText: 'Alice Smith' }).first();

    // 2. Add a sub-entry
    await transactionRow.locator('button[title="Add Entry"]').click();

    // Verify sub-entry setup modal
    await expect(page.getByRole('heading', { name: 'Add Entry for Alice Smith' })).toBeVisible();
    await expect(page.getByPlaceholder('E.g. John Doe')).toBeDisabled();

    // Fill sub-entry details (I Owe ₹500, scoped to the form)
    const form = page.locator('form');
    await form.getByRole('button', { name: 'I Owe' }).click();
    await page.getByPlaceholder('0').fill('500');
    await page.getByPlaceholder('What is this entry for?').fill('Electricity bill offset');
    await form.getByRole('button', { name: 'Add Entry' }).click();

    // 3. Verify total and net amount recalculation (2000 - 500 = 1500)
    await expect(page.getByText('+₹1,500')).toBeVisible();
    await expect(page.getByText('Electricity bill offset').first()).toBeVisible();

    // 4. Click "View Logs" to verify both sub-entries are present in the list
    await transactionRow.locator('button[title="View Logs"]').click();
    await expect(page.getByText('Rent share').first()).toBeVisible();
    await expect(page.getByText('+₹2,000')).toBeVisible();
    await expect(page.getByText('Electricity bill offset').first()).toBeVisible();
    await expect(page.getByText('-₹500')).toBeVisible();

    // 5. Edit transaction and verify direct modification is disabled
    await transactionRow.locator('button[title="Edit"]').click();
    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible();

    // Verify warning banner and that direct editing fields are disabled
    await expect(page.getByText('This transaction has multiple sub-entries. Direct modification of the amount and type is disabled.')).toBeVisible();
    await expect(form.getByRole('button', { name: 'Owed to me' })).toBeDisabled();
    await expect(form.getByRole('button', { name: 'I Owe' })).toBeDisabled();
    await expect(page.getByPlaceholder('0')).toBeDisabled();

    // Change description and supply required reason
    await page.getByPlaceholder('What was this for?').fill('Rent and utilities combined');
    await page.getByPlaceholder('Why are you editing this record?').fill('Update group description');
    await form.getByRole('button', { name: 'Update Record' }).click();

    // Verify the description was updated successfully
    await expect(page.getByText('Rent and utilities combined')).toBeVisible();
  });
});
