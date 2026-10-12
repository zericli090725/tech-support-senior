import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Logs the user into the admin panel via the login page.
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`)

  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL(`${serverURL}/admin`)

  const dashboardArtifact = page.locator('span[title="Dashboard"]')
  await expect(dashboardArtifact).toBeVisible()
}

/**
 * Logs a student into the public app via the student login page.
 */
export async function loginStudent({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/login`)
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Your dashboard' })).toBeVisible()
}
