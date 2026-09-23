const amountMap = {
  "Under £3k": 2500,
  "£3k - £8k": 5500,
  "£8k - £15k": 11500,
  "£15k+": 18000,
};

const getLeadRating = (responses) => {
  const budget = String(responses?.budget ?? "");
  const urgency = String(responses?.urgency ?? "");

  if (
    budget === "£15k+"
    && urgency === "Urgent - ASAP"
  ) return "Platinum";

  const budgetScore = { "Under £3k": 1, "£3k - £8k": 2, "£8k - £15k": 3, "£15k+": 4 };
  const urgencyScore = { "Urgent - ASAP": 2, "Within 1-3 months": 1, "Just researching": 0 };
  const score = (budgetScore[budget] ?? 0) + (urgencyScore[urgency] ?? 0);

  if (score >= 5) return "Gold";
  if (score >= 3) return "Silver";
  return "Bronze";
};

const countryKey = (value) => String(value ?? "").toUpperCase().replaceAll(" ", "_");
const ratingRank = { BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4 };

const isLeadAvailableToPlan = (lead, plan) => {
  const responses = lead.responses;
  const countryAllowed = plan.type === "ALL_COUNTRIES"
    || plan.countries.includes(countryKey(responses?.area));
  const leadRank = ratingRank[getLeadRating(responses).toUpperCase()] ?? 0;
  const highestPlanRank = Math.max(...plan.ratings.map((rating) => ratingRank[rating] ?? 0));
  const ratingAllowed = leadRank <= highestPlanRank;

  return countryAllowed && ratingAllowed;
};

const buildBreakdown = (leads, field) => {
  const counts = new Map();

  leads.forEach((lead) => {
    const responses = lead.responses;
    const value = String(responses?.[field] ?? "Not provided");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts, ([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count);
};

export const getBusinessSummary = async (prisma, plan) => {
  const allLeads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    where: { completed: true },
    select: { id: true, name: true, email: true, phone: true, notes: true, postcode: true, createdAt: true, completedAt: true, responses: true },
  });
  const availableLeads = allLeads.filter((lead) => isLeadAvailableToPlan(lead, plan));
  const totalLeads = availableLeads.length;
  const leadsForMetrics = availableLeads;
  const recentLeads = availableLeads;

  const bookedConsults = leadsForMetrics.filter((lead) => (
    String(lead.responses?.consultation ?? "") === "Yes, book a consultation"
  )).length;
  const urgentLeads = leadsForMetrics.filter((lead) => String(lead.responses?.urgency ?? "") === "Urgent - ASAP");
  const values = leadsForMetrics.flatMap((lead) => amountMap[String(lead.responses?.budget ?? "")] === undefined
    ? [] : [amountMap[String(lead.responses?.budget ?? "")]]);
  const averageOrderValue = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const urgentValues = urgentLeads.flatMap((lead) => amountMap[String(lead.responses?.budget ?? "")] === undefined
    ? [] : [amountMap[String(lead.responses?.budget ?? "")]]);
  const averageUrgentLeadValue = urgentValues.length > 0
    ? urgentValues.reduce((sum, value) => sum + value, 0) / urgentValues.length
    : 0;

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      type: plan.type,
      countries: plan.countries,
      ratings: plan.ratings,
      monthlyPricePence: plan.monthlyPricePence,
      pricePerLeadPence: plan.pricePerLeadPence,
    },
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
      ratings: buildBreakdown(leadsForMetrics.map((lead) => ({ responses: { rating: getLeadRating(lead.responses) } })), "rating"),
    },
    recentLeads: recentLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
      postcode: lead.postcode,
      createdAt: lead.createdAt.toISOString(),
      completedAt: (lead.completedAt ?? lead.createdAt).toISOString(),
      responses: lead.responses,
      estimatedValue: amountMap[String(lead.responses?.budget ?? "")] ?? null,
      rating: getLeadRating(lead.responses),
      goal: String(lead.responses?.goal ?? "General enquiry"),
    })),
  };
};
