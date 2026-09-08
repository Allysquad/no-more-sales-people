import { prisma } from './prisma';

export async function saveLeadSubmissionToDatabase(payload) {
  return prisma.lead.create({
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      postcode: payload.postcode,
      notes: payload.notes,
      responses: payload.responses,
    },
  });
}