import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://app:app_password@localhost:5432/no_more_sales_people?schema=public';

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

test.after(async () => {
  await prisma.$disconnect();
});

test('stores every lead field and questionnaire response in PostgreSQL', async () => {
  const payload = {
    name: 'Database Round Trip',
    email: 'database-round-trip@example.com',
    phone: '07700 123456',
    postcode: 'M1 1AA',
    notes: 'Every submitted detail must survive the database write.',
    responses: {
      goal: 'Windows',
      issue: 'Drafts / heat loss',
      urgency: 'Within 1-3 months',
      property: 'House',
      area: 'North of England',
      budget: '£8k - £15k',
    },
  };

  const created = await prisma.lead.create({ data: payload });

  try {
    const stored = await prisma.lead.findUnique({ where: { id: created.id } });

    assert.ok(stored);
    assert.equal(stored.name, payload.name);
    assert.equal(stored.email, payload.email);
    assert.equal(stored.phone, payload.phone);
    assert.equal(stored.postcode, payload.postcode);
    assert.equal(stored.notes, payload.notes);
    assert.deepEqual(stored.responses, payload.responses);
    assert.ok(stored.createdAt instanceof Date);
  } finally {
    await prisma.lead.delete({ where: { id: created.id } });
  }
});

test('business users can be looked up by email and password in the database', async () => {
  const email = 'business-demo@example.com';
  const password = 'demo-password';

  const created = await prisma.businessUser.create({
    data: {
      name: 'Demo Business User',
      email,
      password,
    },
  });

  try {
    const found = await prisma.businessUser.findUnique({ where: { email } });

    assert.ok(found);
    assert.equal(found.name, 'Demo Business User');
    assert.equal(found.password, password);
    assert.equal(found.id, created.id);
  } finally {
    await prisma.businessUser.delete({ where: { id: created.id } });
  }
});