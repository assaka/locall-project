// E2E test utilities and helpers
import { Page, Browser, BrowserContext } from '@playwright/test';
import { supabase } from '../src/app/utils/supabaseClient';

export class TestHelpers {
  static async loginUser(page: Page, email: string = 'test@example.com', password: string = 'password123') {
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  }

  static async createTestUser(email: string = 'test@example.com', password: string = 'password123') {
    // This would typically use your test database
    // For now, we'll use mock data
    return {
      id: 'test-user-id',
      email,
      created_at: new Date().toISOString(),
    };
  }

  static async cleanupTestData() {
    // Clean up test data after tests
    // This should interact with your test database
    console.log('Cleaning up test data...');
  }

  static async mockAPICall(page: Page, endpoint: string, response: any) {
    await page.route(`**/api/${endpoint}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  static async waitForDashboardLoad(page: Page) {
    await page.waitForSelector('[data-testid="dashboard-content"]');
    await page.waitForLoadState('networkidle');
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  static async fillFormField(page: Page, fieldName: string, value: string) {
    await page.fill(`[data-testid="${fieldName}"]`, value);
  }

  static async clickButton(page: Page, buttonName: string) {
    await page.click(`[data-testid="${buttonName}"]`);
  }

  static async expectToastMessage(page: Page, message: string) {
    await page.waitForSelector('.MuiSnackbar-root');
    const toast = await page.textContent('.MuiAlert-message');
    expect(toast).toContain(message);
  }
}
