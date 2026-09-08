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
      },
    });
  } finally {
    await prisma.lead.deleteMany({ where: { email } });
  }
});