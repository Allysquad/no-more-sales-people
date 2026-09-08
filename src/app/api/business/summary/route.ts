import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalLeads = await prisma.lead.count();

    const recentLeads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        postcode: true,
        createdAt: true,
        responses: true,
      },
    });

    const bookedConsults = recentLeads.filter((lead) => {
      const responses = lead.responses as Record<string, unknown> | null;
      return String(responses?.urgency ?? "") === "Urgent - ASAP";
    }).length;

    const values = recentLeads.map((lead) => {
      const responses = lead.responses as Record<string, unknown> | null;
      const budget = String(responses?.budget ?? "");

      const amountMap: Record<string, number> = {
        "Under £3k": 2500,
        "£3k - £8k": 5500,
        "£8k - £15k": 11500,
        "£15k+": 18000,
      };

      return amountMap[budget] ?? 0;
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
          postcode: lead.postcode,
          createdAt: lead.createdAt.toISOString(),
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
