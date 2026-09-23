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
      budget: '£15k+',
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
];

const plan = {
  id: 'filtered-plan',
  name: 'England and Wales Gold/Bronze',
  type: 'MULTIPLE_COUNTRIES',
  countries: ['ENGLAND', 'WALES'],
  ratings: ['GOLD', 'BRONZE'],
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

  assert.equal(summary.totalLeads, 2);
  assert.deepEqual(summary.recentLeads.map((lead) => lead.name), ['England Gold', 'Wales Bronze']);
  assert.match(csv, /England Gold/);
  assert.match(csv, /Wales Bronze/);
  assert.doesNotMatch(csv, /Scotland Platinum/);
});
