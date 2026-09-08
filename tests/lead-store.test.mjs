import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { saveLeadSubmission, validateLeadSubmission } from '../src/lib/lead-store.js';

test('validateLeadSubmission accepts a valid payload', () => {
  const payload = {
    name: 'Alex Smith',
    email: 'alex@example.com',
    phone: '07700 900123',
    postcode: 'M1 1AA',
    notes: 'Looking for a quote on windows',
    responses: {
      goal: 'Windows',
      urgency: 'Within 1-3 months',
    },
  };

  assert.deepEqual(validateLeadSubmission(payload), {
    name: 'Alex Smith',
    email: 'alex@example.com',
    phone: '07700 900123',
    postcode: 'M1 1AA',
    notes: 'Looking for a quote on windows',
    responses: {
      goal: 'Windows',
      urgency: 'Within 1-3 months',
    },
  });
});

test('validateLeadSubmission rejects each required field when invalid', () => {
  const cases = [
    ['name', { name: 'A' }, 'Name is required.'],
    ['email', { email: 'not-an-email' }, 'A valid email is required.'],
    ['phone', { phone: '1234567' }, 'A valid phone number is required.'],
    ['postcode', { postcode: 'A1' }, 'A valid postcode is required.'],
  ];

  for (const [field, value, message] of cases) {
    assert.throws(
      () => validateLeadSubmission({
        name: 'Valid Name',
        email: 'valid@example.com',
        phone: '07700 900123',
        postcode: 'M1 1AA',
        [field]: value[field],
      }),
      { message },
    );
  }
});

test('validateLeadSubmission defaults missing optional values', () => {
  assert.deepEqual(validateLeadSubmission({
    name: 'Alex Smith',
    email: 'alex@example.com',
    phone: '07700 900123',
    postcode: 'M1 1AA',
  }), {
    name: 'Alex Smith',
    email: 'alex@example.com',
    phone: '07700 900123',
    postcode: 'M1 1AA',
    notes: '',
    responses: {},
  });
});

test('saveLeadSubmission stores a new lead record', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lead-store-'));
  const targetFile = path.join(tempDir, 'leads.json');

  const payload = {
    name: 'Sam Green',
    email: 'sam@example.com',
    phone: '07123 456789',
    postcode: 'B1 2AA',
    notes: 'Need a front door replacement',
    responses: {
      goal: 'Doors',
      urgency: 'Urgent - ASAP',
    },
  };

  const stored = await saveLeadSubmission(payload, targetFile);
  const raw = await fs.readFile(targetFile, 'utf8');
  const data = JSON.parse(raw);

  assert.equal(data.length, 1);
  assert.equal(data[0].name, 'Sam Green');
  assert.equal(data[0].email, 'sam@example.com');
  assert.equal(stored.name, 'Sam Green');
});

test('saveLeadSubmission appends to existing records and recovers from invalid files', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lead-store-'));
  const targetFile = path.join(tempDir, 'leads.json');
  const payload = {
    name: 'Taylor Brown',
    email: 'taylor@example.com',
    phone: '07000 111222',
    postcode: 'B1 2AA',
  };

  await fs.writeFile(targetFile, JSON.stringify([{ name: 'Existing Lead' }]), 'utf8');
  await saveLeadSubmission(payload, targetFile);
  assert.equal(JSON.parse(await fs.readFile(targetFile, 'utf8')).length, 2);

  await fs.writeFile(targetFile, 'not-json', 'utf8');
  await saveLeadSubmission(payload, targetFile);
  assert.equal(JSON.parse(await fs.readFile(targetFile, 'utf8')).length, 1);

  await fs.writeFile(targetFile, JSON.stringify({ invalid: true }), 'utf8');
  await saveLeadSubmission(payload, targetFile);
  assert.equal(JSON.parse(await fs.readFile(targetFile, 'utf8')).length, 1);
});
