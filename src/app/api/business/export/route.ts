import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const amountMap: Record<string, number> = {
  "Under £3k": 2500,
  "£3k - £8k": 5500,
  "£8k - £15k": 11500,
  "£15k+": 18000,
};

const csvValue = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
};

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "id",
      "name",
      "email",
      "phone",
      "postcode",
      "notes",
      "createdAt",
      "goal",
      "issue",
      "urgency",
      "property",
      "area",
      "budget",
      "estimatedValue",
      "consultation",
    ];
    const rows = leads.map((lead) => {
      const responses = lead.responses as Record<string, unknown> | null;
      const budget = String(responses?.budget ?? "");

      return [
        lead.id,
        lead.name,
        lead.email,
        lead.phone,
        lead.postcode,
        lead.notes,
        lead.createdAt.toISOString(),
        responses?.goal,
        responses?.issue,
        responses?.urgency,
        responses?.property,
        responses?.area,
        budget,
        amountMap[budget],
        responses?.consultation,
      ].map(csvValue).join(",");
    });
    const csv = [headers.map(csvValue).join(","), ...rows].join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Disposition": "attachment; filename=leads.csv",
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export leads.";

    return NextResponse.json(
      { success: false, message },
      { status: 400 },
    );
  }
}
