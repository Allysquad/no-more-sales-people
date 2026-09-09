import { NextResponse } from "next/server";

const amountMap: Record<string, number> = {
  "Under £3k": 2500,
  "£3k - £8k": 5500,
  "£8k - £15k": 11500,
  "£15k+": 18000,
};

type LeadRating = "Bronze" | "Silver" | "Gold" | "Platinum";

const getLeadRating = (responses: Record<string, unknown> | null): LeadRating => {
  const budget = String(responses?.budget ?? "");
  const urgency = String(responses?.urgency ?? "");
  const consultation = String(responses?.consultation ?? "");

  if (
    budget === "£15k+"
    && urgency === "Urgent - ASAP"
    && consultation === "Yes, book a consultation"
  ) {
    return "Platinum";
  }

  const budgetScore: Record<string, number> = {
    "Under £3k": 1,
    "£3k - £8k": 2,
    "£8k - £15k": 3,
    "£15k+": 4,
  };
  const urgencyScore: Record<string, number> = {
    "Urgent - ASAP": 2,
    "Within 1-3 months": 1,
    "Just researching": 0,
  };
  const score = (budgetScore[budget] ?? 0) + (urgencyScore[urgency] ?? 0);

  if (score >= 5) return "Gold";
  if (score >= 3) return "Silver";
  return "Bronze";
};

import { prisma } from "@/lib/prisma";

const buildBreakdown = (leads: Array<{ responses: unknown }>, field: string) => {
  const counts = new Map<string, number>();

  leads.forEach((lead) => {
    const responses = lead.responses as Record<string, unknown> | null;
    const value = String(responses?.[field] ?? "Not provided");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts, ([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count);
};

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

    const urgentLeads = leadsForMetrics.filter((lead) => {
      const responses = lead.responses as Record<string, unknown> | null;
      return String(responses?.urgency ?? "") === "Urgent - ASAP";
    });

    const values = leadsForMetrics.flatMap((lead) => {
      const responses = lead.responses as Record<string, unknown> | null;
      const budget = String(responses?.budget ?? "");

      return amountMap[budget] === undefined ? [] : [amountMap[budget]];
    });

    const averageOrderValue = values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

    const urgentValues = urgentLeads.flatMap((lead) => {
      const responses = lead.responses as Record<string, unknown> | null;
      const budget = String(responses?.budget ?? "");

      return amountMap[budget] === undefined ? [] : [amountMap[budget]];
    });
    const averageUrgentLeadValue = urgentValues.length > 0
      ? urgentValues.reduce((sum, value) => sum + value, 0) / urgentValues.length
      : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalLeads,
        bookedConsults,
        averageOrderValue,
        urgentLeads: urgentLeads.length,
        averageUrgentLeadValue,
        breakdowns: {
          goals: buildBreakdown(leadsForMetrics, "goal"),
          urgency: buildBreakdown(leadsForMetrics, "urgency"),
          budgets: buildBreakdown(leadsForMetrics, "budget"),
          areas: buildBreakdown(leadsForMetrics, "area"),
          ratings: buildBreakdown(
            leadsForMetrics.map((lead) => ({
              responses: { rating: getLeadRating(lead.responses as Record<string, unknown> | null) },
            })),
            "rating",
          ),
        },
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
          rating: getLeadRating(lead.responses as Record<string, unknown> | null),
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
