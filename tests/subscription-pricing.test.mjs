import assert from 'node:assert/strict';
import test from 'node:test';

const { calculateSubscription } = await import('../src/lib/subscription-pricing.js');

test('calculates locked country and rating subscription prices', () => {
  assert.equal(calculateSubscription({ type: 'ONE_COUNTRY', countries: ['SCOTLAND'], rating: 'BRONZE' }).monthlyPricePence, 100000);
  assert.equal(calculateSubscription({ type: 'ONE_COUNTRY', countries: ['ENGLAND'], rating: 'SILVER' }).monthlyPricePence, 240000);
  assert.equal(calculateSubscription({ type: 'MULTIPLE_COUNTRIES', countries: ['SCOTLAND', 'WALES'], rating: 'SILVER' }).monthlyPricePence, 194400);
  assert.equal(calculateSubscription({ type: 'ALL_COUNTRIES', countries: [], rating: 'BRONZE' }).monthlyPricePence, 344000);
});

test('rejects invalid country scope combinations', () => {
  assert.throws(
    () => calculateSubscription({ type: 'ONE_COUNTRY', countries: ['SCOTLAND', 'WALES'], rating: 'BRONZE' }),
    /exactly one country/,
  );
  assert.throws(
    () => calculateSubscription({ type: 'ALL_COUNTRIES', countries: ['SCOTLAND'], rating: 'BRONZE' }),
    /must not include individual countries/,
  );
});
