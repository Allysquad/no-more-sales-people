import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('completes the funnel and persists every submitted value', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto('/');

  const steps = [
    ['What are you looking to improve?', 'Windows'],
    ['What is the biggest issue right now?', 'Drafts / heat loss'],
    ['How quickly do you need this sorted?', 'Within 1-3 months'],
    ['What type of property do you have?', 'House'],
    ['Which area are you based in?', 'North of England'],
    ['What budget are you working with?', '£8k - £15k'],
    ['Would you like to book a consultation?', 'Yes, book a consultation'],
  ];

  for (const [question, answer] of steps) {
    await expect(page.getByRole('heading', { name: question })).toBeVisible();
    await page.locator('button').filter({ hasText: answer }).first().click();
  }

  await expect(page.getByRole('heading', { name: 'Full Home Upgrade Package' })).toBeVisible();

  await page.getByLabel('Full name').fill('E2E Test User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Phone').fill('07700 123456');
  await page.getByLabel('Postcode').fill('M1 1AA');
  await page.getByLabel('Project notes').fill('End-to-end persistence test');

  const responsePromise = page.waitForResponse((response) => (
    response.url().endsWith('/api/leads') && response.request().method() === 'POST'
  ));

  await page.getByRole('button', { name: 'Send my enquiry' }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);
  await expect(page.getByText('Your enquiry has been submitted successfully.')).toBeVisible();
  const body = await response.json();
  expect(body.lead.id).toBeTruthy();

  try {
    const stored = await prisma.lead.findUnique({ where: { id: body.lead.id } });

    expect(stored).not.toBeNull();
    expect(stored).toMatchObject({
      name: 'E2E Test User',
      email,
      phone: '07700 123456',
      postcode: 'M1 1AA',
      notes: 'End-to-end persistence test',
      responses: {
        goal: 'Windows',
        issue: 'Drafts / heat loss',
        urgency: 'Within 1-3 months',
        property: 'House',
        area: 'North of England',
        budget: '£8k - £15k',
        consultation: 'Yes, book a consultation',
      },
    });
  } finally {
    await prisma.lead.deleteMany({ where: { email } });
  }
});

test('keeps the selected answer highlighted when going back and allows it to change', async ({ page }) => {
  await page.goto('/');

  const windows = page.getByRole('button', { name: /^Windows/ });
  const doors = page.getByRole('button', { name: /^Doors/ });

  await expect(windows).toHaveAttribute('aria-pressed', 'false');
  await windows.click();
  await expect(page.getByRole('heading', { name: 'What is the biggest issue right now?' })).toBeVisible();

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { name: 'What are you looking to improve?' })).toBeVisible();
  await expect(windows).toHaveAttribute('aria-pressed', 'true');

  await doors.click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(doors).toHaveAttribute('aria-pressed', 'true');
  await expect(windows).toHaveAttribute('aria-pressed', 'false');
});

test('includes consultation as question seven and Home resets the completed flow', async ({ page }) => {
  await page.goto('/');

  const answers = [
    'Windows',
    'Drafts / heat loss',
    'Within 1-3 months',
    'House',
    'North of England',
    '£8k - £15k',
  ];

  for (const answer of answers) {
    await page.locator('button').filter({ hasText: answer }).first().click();
  }

  await expect(page.getByRole('heading', { name: 'Would you like to book a consultation?' })).toBeVisible();
  await page.getByRole('button', { name: /^No thanks/ }).click();
  await expect(page.getByRole('heading', { name: 'Full Home Upgrade Package' })).toBeVisible();

  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { name: 'What are you looking to improve?' })).toBeVisible();
  await expect(page.getByText('0 of 7 answered')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Windows/ })).toHaveAttribute('aria-pressed', 'false');
});

test('opens complete lead details and calculates analytics across all valid budgets', async ({ page }) => {
  const email = `analytics-${Date.now()}@example.com`;
  const lead = await prisma.lead.create({
    data: {
      name: 'Analytics Detail User',
      email,
      phone: '07700 555555',
      postcode: 'M1 1AA',
      notes: 'Please call about a full home upgrade.',
      responses: {
        goal: 'Windows',
        issue: 'Drafts / heat loss',
        urgency: 'Urgent - ASAP',
        property: 'House',
        area: 'North of England',
        budget: '£15k+',
        consultation: 'Yes, book a consultation',
      },
    },
  });

  try {
    const allLeads = await prisma.lead.findMany({ select: { responses: true } });
    const amounts = {
      'Under £3k': 2500,
      '£3k - £8k': 5500,
      '£8k - £15k': 11500,
      '£15k+': 18000,
    };
    const validValues = allLeads
      .map(({ responses }) => amounts[String((responses as Record<string, unknown>).budget) as keyof typeof amounts])
      .filter((value): value is number => value !== undefined);
    const expectedAverage = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
    const expectedBookedConsults = allLeads.filter(({ responses }) => (
      String((responses as Record<string, unknown>).consultation) === 'Yes, book a consultation'
    )).length;
    const urgentResponses = allLeads.filter(({ responses }) => (
      String((responses as Record<string, unknown>).urgency) === 'Urgent - ASAP'
    ));
    const urgentValues = urgentResponses
      .map(({ responses }) => amounts[String((responses as Record<string, unknown>).budget) as keyof typeof amounts])
      .filter((value): value is number => value !== undefined);
    const expectedUrgentAverage = urgentValues.length > 0
      ? urgentValues.reduce((sum, value) => sum + value, 0) / urgentValues.length
      : 0;

    await page.goto('/');
    await page.getByRole('button', { name: 'Business analytics' }).click();
    await page.getByLabel('Business email').fill('business@nomoresalespeople.com');
    await page.getByLabel('Password').fill('demo-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Lead summary view' })).toBeVisible();
    await expect(page.getByText(new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(expectedAverage))).toBeVisible();
    await expect(
      page.getByText('Booked consults').locator('..').getByText(String(expectedBookedConsults), { exact: true }),
    ).toBeVisible();
    const hotLeadsCard = page.getByText('Hot leads').locator('..');
    await expect(hotLeadsCard.getByText(String(urgentResponses.length), { exact: true })).toBeVisible();
    await expect(hotLeadsCard.getByText(
      `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(expectedUrgentAverage)} average value`,
    )).toBeVisible();

    await page.getByRole('button', { name: 'Analytics dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Analytics dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product goals' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Urgency' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lead ratings' })).toBeVisible();
    await expect(page.getByText('Hot lead share')).toBeVisible();
    await page.getByRole('button', { name: 'Lead summary view' }).click();
    await expect(page.getByRole('heading', { name: 'Lead summary view' })).toBeVisible();

    const exportResponsePromise = page.waitForResponse((response) => (
      response.url().endsWith('/api/business/export') && response.request().method() === 'GET'
    ));
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const exportResponse = await exportResponsePromise;
    expect(exportResponse.status()).toBe(200);
    expect(exportResponse.headers()['content-type']).toContain('text/csv');
    const exportedCsv = await page.request.get('/api/business/export');
    expect(await exportedCsv.text()).toContain('Analytics Detail User');

    const platinumLead = page.getByRole('button', { name: 'Open details for Analytics Detail User' });
    await expect(platinumLead).toHaveClass(/border-fuchsia/);
    await platinumLead.click();
    const detailPanel = page.getByRole('heading', { name: 'Analytics Detail User' }).locator('../../..');
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel.getByText(email)).toBeVisible();
    await expect(detailPanel.getByText('07700 555555')).toBeVisible();
    await expect(detailPanel.getByText('Please call about a full home upgrade.')).toBeVisible();
    await expect(detailPanel.getByText('Full Home Upgrade Package')).toBeVisible();
    await expect(detailPanel.getByText('Yes, book a consultation')).toBeVisible();
    await expect(detailPanel.getByText('£15k+')).toBeVisible();
    await expect(detailPanel.getByText('Platinum')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await detailPanel.getByRole('button', { name: 'Delete lead' }).click();
    await expect(page.getByRole('button', { name: 'Open details for Analytics Detail User' })).toHaveCount(0);
  } finally {
    await prisma.lead.deleteMany({ where: { id: lead.id } });
  }
});