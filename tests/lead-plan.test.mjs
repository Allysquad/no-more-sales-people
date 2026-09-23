import assert from 'node:assert/strict';
import test from 'node:test';

const { getBusinessSummary } = await import('../src/lib/business-summary.js');
const { getBusinessLeadsCsv } = await import('../src/lib/business-export.js');

const leads = [
  {
    id: 'scotland-platinum',
    name: 'Scotland Platinum',
    email: 'scotland@example.com',
    phone: '07700 000001',
    postcode: 'M1 1AA',
    notes: '',
    createdAt: new Date('2026-09-23T12:00:00Z'),
    responses: {
      area: 'Scotland',
      budget: '£15k+',
      urgency: 'Urgent - ASAP',
      consultation: 'Yes, book a consultation',
      goal: 'Windows',
    },
  },
  {
    id: 'england-gold',
    name: 'England Gold',
    email: 'england-gold@example.com',
    phone: '07700 000002',
    postcode: 'B1 1AA',
    notes: '',
    createdAt: new Date('2026-09-22T12:00:00Z'),
    responses: {
      area: 'England',
      budget: '£8k - £15k',
      urgency: 'Urgent - ASAP',
      consultation: 'No thanks, just show my recommendation',
      goal: 'Doors',
    },
  },
  {
    id: 'wales-bronze',
    name: 'Wales Bronze',
    email: 'wales@example.com',
    phone: '07700 000003',
    postcode: 'CF1 1AA',
    notes: '',
    createdAt: new Date('2026-09-21T12:00:00Z'),
    responses: {
      area: 'Wales',
      budget: 'Under £3k',
      urgency: 'Just researching',
      consultation: 'No thanks, just show my recommendation',
      goal: 'Both',
    },
  },
  {
    id: 'wales-gold',
    name: 'Wales Gold',
    email: 'wales-gold@example.com',
    phone: '07700 000004',
    postcode: 'CF2 2AA',
    notes: '',
    createdAt: new Date('2026-09-20T12:00:00Z'),
    responses: {
      area: 'Wales',
      budget: '£8k - £15k',
      urgency: 'Urgent - ASAP',
      consultation: 'No thanks, just show my recommendation',
      goal: 'Windows',
    },
  },
  {
    id: 'wales-platinum',
    name: 'Wales Platinum',
    email: 'wales-platinum@example.com',
    phone: '07700 000005',
    postcode: 'CF3 3AA',
    notes: '',
    createdAt: new Date('2026-09-19T12:00:00Z'),
    responses: {
      area: 'Wales',
      budget: '£15k+',
      urgency: 'Urgent - ASAP',
      consultation: 'No thanks, just show my recommendation',
      goal: 'Both',
    },
  },
  {
    id: 'ireland-bronze',
    name: 'Ireland Bronze',
    email: 'ireland@example.com',
    phone: '07700 000006',
    postcode: 'D1 1AA',
    notes: '',
    createdAt: new Date('2026-09-18T12:00:00Z'),
    responses: {
      area: 'Ireland',
      budget: 'Under £3k',
      urgency: 'Just researching',
      goal: 'Doors',
    },
  },
];

const plan = {
  id: 'filtered-plan',
  name: 'England and Wales Gold/Bronze',
  type: 'MULTIPLE_COUNTRIES',
  countries: ['ENGLAND', 'WALES'],
  ratings: ['GOLD'],
  monthlyPricePence: 9900,
  pricePerLeadPence: 2500,
};

const fakePrisma = {
  lead: {
    findMany: async () => leads,
  },
};

test('filters summary and export by plan country and rating', async () => {
  const summary = await getBusinessSummary(fakePrisma, plan);
  const csv = await getBusinessLeadsCsv(fakePrisma, plan);

  assert.equal(summary.totalLeads, 3);
  assert.deepEqual(summary.recentLeads.map((lead) => lead.name), ['England Gold', 'Wales Bronze', 'Wales Gold']);
  assert.match(csv, /England Gold/);
  assert.match(csv, /Wales Bronze/);
  assert.match(csv, /Wales Gold/);
  assert.doesNotMatch(csv, /Scotland Platinum/);
});

test('does not export higher-rated leads from an allowed country', async () => {
  const goldWalesPlan = {
    id: 'wales-gold-plan',
    name: 'Wales Gold',
    type: 'ONE_COUNTRY',
    countries: ['WALES'],
    ratings: ['GOLD'],
    monthlyPricePence: 140000,
    pricePerLeadPence: 2500,
  };

  const csv = await getBusinessLeadsCsv(fakePrisma, goldWalesPlan);

  assert.match(csv, /Wales Gold/);
  assert.match(csv, /Wales Bronze/);
  assert.doesNotMatch(csv, /Wales Platinum/);
  assert.doesNotMatch(csv, /Scotland Platinum/);
  assert.doesNotMatch(csv, /England Gold/);
  assert.doesNotMatch(csv, /Ireland Bronze/);
});
