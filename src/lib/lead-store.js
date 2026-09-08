import fs from 'node:fs/promises';
import path from 'node:path';

const defaultLeadFile = path.join(process.cwd(), 'data', 'leads.json');

export function validateLeadSubmission(payload) {
  const name = String(payload?.name || '').trim();
  const email = String(payload?.email || '').trim();
  const phone = String(payload?.phone || '').trim();
  const postcode = String(payload?.postcode || '').trim();
  const notes = String(payload?.notes || '').trim();
  const responses = payload?.responses && typeof payload.responses === 'object' ? payload.responses : {};

  if (!name || name.length < 2) {
    throw new Error('Name is required.');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('A valid email is required.');
  }

  if (!phone || phone.length < 8) {
    throw new Error('A valid phone number is required.');
  }

  if (!postcode || postcode.length < 4) {
    throw new Error('A valid postcode is required.');
  }

  return {
    name,
    email,
    phone,
    postcode,
    notes,
    responses,
  };
}

export async function saveLeadSubmission(payload, targetFile = defaultLeadFile) {
  const validated = validateLeadSubmission(payload);

  const directory = path.dirname(targetFile);
  await fs.mkdir(directory, { recursive: true });

  let records = [];
  try {
    const existing = await fs.readFile(targetFile, 'utf8');
    if (existing.trim()) {
      records = JSON.parse(existing);
      if (!Array.isArray(records)) {
        records = [];
      }
    }
  } catch {
    records = [];
  }

  const record = {
    ...validated,
    createdAt: new Date().toISOString(),
  };

  records.push(record);
  await fs.writeFile(targetFile, JSON.stringify(records, null, 2), 'utf8');

  return record;
}
