import { test, expect } from '@playwright/test'

import { loginStudent } from '../helpers/login'

const seededStudent = {
  email: 'alex@student.edu',
  password: 'changeme',
}

test.describe('Guest frontend', () => {
  test('shows the homepage and guest navigation', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Senior Tech Support/)
    await expect(
      page.getByRole('heading', {
        name: 'Connect students who like tech with seniors who need a hand.',
      }),
    ).toBeVisible()

    const nav = page.getByRole('navigation')
    await expect(nav.getByRole('link', { name: 'Student login' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Register' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Staff login' })).toHaveAttribute('href', '/staff/login')
    await expect(page.getByRole('link', { name: 'Center staff login' })).toHaveAttribute(
      'href',
      '/staff/login',
    )
    await expect(page.getByRole('link', { name: 'Register as a student' })).toBeVisible()
  })

  test('sends unauthenticated visitors from student pages to login', async ({ page }) => {
    for (const path of ['/dashboard', '/centers', '/tickets', '/events', '/profile']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
      await expect(page.getByRole('heading', { name: 'Student login' })).toBeVisible()
    }
  })

  test('shows an error for invalid student credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('nobody@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('The email or password provided is incorrect.')).toBeVisible()
  })
})

test.describe('New student', () => {
  test('requires matching passwords to register', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('textbox', { name: 'Name' }).fill('E2E Student')
    await page.getByRole('textbox', { name: 'Email' }).fill('e2e@student.edu')
    await page.getByLabel('Password', { exact: true }).fill('changeme')
    await page.getByLabel('Confirm password').fill('different')
    await page.getByRole('button', { name: 'Create student account' }).click()

    await expect(page.getByText('Passwords do not match.')).toBeVisible()
    await expect(page).toHaveURL(/\/register/)
  })

  test('can register, see empty dashboard, and request to join a center', async ({ page }) => {
    const email = `e2e-${Date.now()}@student.edu`

    await page.goto('/register')
    await page.getByRole('textbox', { name: 'Name' }).fill('E2E Student')
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill('changeme')
    await page.getByLabel('Confirm password').fill('changeme')
    await page.getByRole('button', { name: 'Create student account' }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Your dashboard' })).toBeVisible()
    await expect(page.getByText('0 hours logged · 0 approved centers')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Request to join a center' })).toBeVisible()

    await page.getByRole('link', { name: 'Centers' }).click()
    await expect(page.getByRole('heading', { name: 'Centers' })).toBeVisible()

    await page
      .getByRole('article')
      .filter({ hasText: 'Lakeside Senior Center' })
      .getByRole('button', { name: 'Request to join' })
      .click()

    await expect(
      page.getByRole('article').filter({ hasText: 'Lakeside Senior Center' }).getByText('Pending approval'),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Tickets' }).click()
    await expect(page.getByText(/No open tickets right now/)).toBeVisible()

    await page.getByRole('link', { name: 'Events' }).click()
    await expect(page.getByText(/No upcoming events at your approved centers/)).toBeVisible()
  })
})

test.describe('Staff dashboard', () => {
  test('uses the site login instead of the Payload admin', async ({ page }) => {
    await page.goto('/staff')
    await expect(page).toHaveURL(/\/staff\/login/)
    await expect(page.getByRole('heading', { name: 'Staff login' })).toBeVisible()
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test('center staff can sign in and manage tickets and volunteers', async ({ page }) => {
    const lastName = `Senior${Date.now()}`
    const seniorName = `E2E ${lastName}`

    await page.goto('/staff/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('maria@lakeside.org')
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByText('The email or password provided is incorrect.')).toBeVisible()

    await page.getByRole('textbox', { name: 'Email' }).fill('alex@student.edu')
    await page.getByRole('textbox', { name: 'Password' }).fill('changeme')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByText('The email or password provided is incorrect.')).toBeVisible()

    await page.getByRole('textbox', { name: 'Email' }).fill('maria@lakeside.org')
    await page.getByRole('textbox', { name: 'Password' }).fill('changeme')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL(/\/staff$/)
    await expect(page.getByRole('heading', { name: 'Staff dashboard' })).toBeVisible()
    await expect(page.getByText('Lakeside Senior Center')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Team' })).toHaveCount(0)

    await page.getByRole('navigation', { name: 'Staff' }).getByRole('link', { name: 'Tickets' }).click()
    await page.getByRole('link', { name: 'New ticket' }).click()
    await page.getByLabel('Senior profile').selectOption({ label: 'Add a new senior' })
    await page.getByRole('textbox', { name: 'First name' }).fill('E2E')
    await page.getByRole('textbox', { name: 'Last name' }).fill(lastName)
    await page.getByRole('textbox', { name: 'Issue' }).fill('Needs help saving photos from a phone.')
    await page.getByRole('button', { name: 'Save ticket' }).click()

    await expect(page.getByRole('heading', { name: seniorName })).toBeVisible()
    await page.getByRole('link', { name: 'Senior profile' }).click()
    await expect(page.getByRole('heading', { name: seniorName })).toBeVisible()
    await expect(page.getByText('Needs help saving photos from a phone.')).toBeVisible()
    await expect(page.getByText(/Through the center · /)).toBeVisible()

    await page.getByRole('link', { name: 'Needs help saving photos from a phone.' }).click()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete ticket' }).click()
    await expect(page).toHaveURL(/\/staff\/tickets$/)
    await expect(page.getByRole('heading', { name: seniorName })).toHaveCount(0)

    await page.getByRole('navigation', { name: 'Staff' }).getByRole('link', { name: 'Seniors' }).click()
    await page.getByRole('textbox', { name: 'Search' }).fill(lastName)
    await page.getByRole('button', { name: 'Search' }).click()
    await page.getByRole('link', { name: seniorName }).click()
    await expect(page.getByText('No tickets yet.')).toBeVisible()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete senior' }).click()
    await expect(page).toHaveURL(/\/staff\/seniors/)

    await page.getByRole('navigation', { name: 'Staff' }).getByRole('link', { name: 'Volunteers' }).click()
    const sam = page.getByRole('listitem').filter({ hasText: 'Sam Okonkwo' })
    await sam.getByRole('button', { name: 'Approve' }).click()
    await expect(sam.getByText('Approved')).toBeVisible()
    await sam.getByRole('button', { name: 'Mark pending' }).click()
    await expect(sam.getByText('Pending approval')).toBeVisible()

    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Staff login' })).toBeVisible()
  })

  test('super admin can manage centers and open team tools', async ({ page }) => {
    const centerName = `E2E Center ${Date.now()}`

    await page.goto('/staff/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('admin@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('changeme')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByRole('heading', { name: 'Staff dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Team' })).toBeVisible()

    await page.getByRole('navigation', { name: 'Staff' }).getByRole('link', { name: 'Centers' }).click()
    await page.getByRole('link', { name: 'New center' }).click()
    await page.getByRole('textbox', { name: 'Name' }).fill(centerName)
    await page.getByRole('textbox', { name: 'Address' }).fill('1 Test Lane')
    await page.getByRole('button', { name: 'Create center' }).click()

    await expect(page.getByRole('heading', { name: centerName })).toBeVisible()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete center' }).click()
    await expect(page).toHaveURL(/\/staff\/centers$/)
    await expect(page.getByText(centerName)).toHaveCount(0)

    await page.getByRole('link', { name: 'Team' }).click()
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible()
    await page.getByRole('link', { name: 'New staff user' }).click()
    await expect(page.getByRole('heading', { name: 'New staff user' })).toBeVisible()

    await page.getByRole('link', { name: 'Media' }).click()
    await expect(page.getByRole('heading', { name: 'Media' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload file' })).toBeVisible()
  })
})

test.describe('Seeded student', () => {
  test('can log in and open dashboard, tickets, events, and hours', async ({ page }) => {
    await loginStudent({ page, user: seededStudent })

    await expect(page.getByText(/approved center/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Assigned tickets' })).toBeVisible()

    await page.getByRole('link', { name: 'Tickets' }).click()
    await expect(page.getByRole('heading', { name: 'Open tickets' })).toBeVisible()

    await page.getByRole('link', { name: 'Events' }).click()
    await expect(page.getByRole('heading', { name: 'Tech Help Thursday' })).toBeVisible()

    await page.getByRole('link', { name: 'Hours' }).click()
    await expect(page.getByRole('heading', { name: 'Alex Rivera' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log hours' })).toBeVisible()

    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Student login' })).toBeVisible()
  })
})
