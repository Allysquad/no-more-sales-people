import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const names = [
  'Amelia Carter',
  'Oliver Bennett',
  'Isla Morgan',
  'Noah Hughes',
  'Freya Collins',
  'George Ward',
  'Ava Mitchell',
  'Arthur Bailey',
  'Lily Cooper',
  'Henry Richardson',
];
const goals = ['Windows', 'Doors', 'Both', 'Conservatory / extension'];
const issues = ['Drafts / heat loss', 'Security / break-ins', 'Looks / outdated style', 'Noise / sound insulation'];
const urgencies = ['Urgent - ASAP', 'Within 1-3 months', 'Just researching'];
const properties = ['House', 'Bungalow', 'Flat / apartment', 'Commercial property'];
const areas = ['North of England', 'Midlands', 'South of England', 'Not sure yet'];
const budgets = ['Under £3k', '£3k - £8k', '£8k - £15k', '£15k+'];

const pick = (values) => values[Math.floor(Math.random() * values.length)];

async function main() {
  const deleted = await prisma.lead.deleteMany({
    where: { email: { startsWith: 'demo-lead-' } },
  });

  for (let index = 1; index <= 10; index += 1) {
    const email = `demo-lead-${String(index).padStart(2, '0')}@example.com`;

    await prisma.lead.create({
      data: {
        name: names[index - 1],
        email,
        phone: `07700 ${String(100000 + Math.floor(Math.random() * 899999))}`,
        postcode: `${pick(['M1', 'B1', 'LS1', 'BS1', 'NG1'])} ${Math.floor(1 + Math.random() * 9)}${pick(['AA', 'AB', 'BC', 'CD'])}`,
        notes: `Demo enquiry for ${pick(['replacement windows', 'a new front door', 'a full home upgrade', 'a conservatory refresh'])}.`,
        responses: {
          goal: pick(goals),
          issue: pick(issues),
          urgency: pick(urgencies),
          property: pick(properties),
          area: pick(areas),
          budget: pick(budgets),
          consultation: Math.random() > 0.45
            ? 'Yes, book a consultation'
            : 'No thanks, just show my recommendation',
        },
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      },
    });
  }

  console.log(`Demo lead seed complete: ${deleted.count} old demo leads removed, 10 fresh demo leads created.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
