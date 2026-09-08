import { NextResponse } from 'next/server';
import { saveLeadSubmissionToDatabase } from '@/lib/lead-repository';
import { validateLeadSubmission } from '@/lib/lead-store';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validated = validateLeadSubmission(payload);
    const record = await saveLeadSubmissionToDatabase(validated);

    return NextResponse.json({
      success: true,
      message: 'Lead submitted successfully.',
      lead: record,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit lead.';

    return NextResponse.json({
      success: false,
      message,
    }, { status: 400 });
  }
}
