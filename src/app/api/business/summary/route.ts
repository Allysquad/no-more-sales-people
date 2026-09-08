import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalLeads = await prisma.lead.count();

    const leadsForMetrics = await prisma.lead.findMany({
      select: { responses: true },
    });

    const recentLeads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        postcode: true,
        createdAt: true,
        responses: true,
      },
    });

    const bookedConsults = leadsForMetrics.filter((lead) => {
      const responses = lead.responses as Record<string, unknown> | null;
      return String(responses?.consultation ?? "") === "Yes, book a consultation";
    }).length;

    const amountMap: Record<string, number> = {
      "Under £3k": 2500,
      "£3k - £8k": 5500,
      "£8k - £15k": 11500,
      "£15k+": 18000,
    };

    const values = leadsForMetrics.flatMap((lead) => {
      const responses = lead.responses as Record<string, unknown> | null;
      const budget = String(responses?.budget ?? "");

      return amountMap[budget] === undefined ? [] : [amountMap[budget]];
    });

    const averageOrderValue = values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalLeads,
        bookedConsults,
        averageOrderValue,
        recentLeads: recentLeads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          notes: lead.notes,
          postcode: lead.postcode,
          createdAt: lead.createdAt.toISOString(),
          responses: lead.responses as Record<string, string>,
          estimatedValue: amountMap[String((lead.responses as Record<string, unknown> | null)?.budget ?? "")] ?? null,
          goal: String((lead.responses as Record<string, unknown> | null)?.goal ?? "General enquiry"),
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load business summary.";

    return NextResponse.json(
      { success: false, message },
      { status: 400 },
    );
  }
}
