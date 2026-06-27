import { test, expect } from '@playwright/test';

test.describe('Sahay Wellness Companion', () => {
  // Disable Clerk auth for testing by setting a cookie or navigating to a bypass if needed, 
  // but wait, Clerk in a dev environment allows bypass if configured or if we just test the UI.
  // Our page.tsx tests `!isLoaded` but we don't have a strict middleware block on `/` in this codebase.

  test('User can complete the onboarding flow', async ({ page }) => {
    // Go to the main page
    await page.goto('/');

    // Ensure the setup screen is visible
    await expect(page.locator('text=Let\'s set up your profile')).toBeVisible();

    // Select an exam
    await page.locator('button', { hasText: 'JEE' }).click();

    // Fill in a date
    await page.locator('input[type="date"]').fill('2027-01-01');

    // Submit
    await page.locator('button', { hasText: 'Save & Continue' }).click();

    // Verify dashboard renders with the selected exam
    await expect(page.locator('text=days to JEE')).toBeVisible();
    await expect(page.locator('text=Your Exam')).toBeVisible();
  });

  test('User can open the text chat', async ({ page }) => {
    // Inject localStorage state to skip setup
    await page.addInitScript(() => {
      window.localStorage.setItem('sahay_examName', 'NEET');
      window.localStorage.setItem('sahay_examDate', '2026-05-01');
    });

    await page.goto('/');

    // Wait for dashboard to load
    await expect(page.locator('text=days to NEET')).toBeVisible();

    // Click the chat button
    await page.locator('button', { hasText: 'Chat via text' }).click();

    // The chat modal should open
    await expect(page.locator('input[placeholder="Type a message..."]')).toBeVisible();
  });
});
