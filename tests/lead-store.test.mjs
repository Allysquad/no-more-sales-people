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
