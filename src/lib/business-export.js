const amountMap = {
  "Under £3k": 2500,
  "£3k - £8k": 5500,
  "£8k - £15k": 11500,
  "£15k+": 18000,
};

const csvValue = (value) => {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
};

const getLeadRating = (responses) => {
  const budgetScore = { "Under £3k": 1, "£3k - £8k": 2, "£8k - £15k": 3, "£15k+": 4 };
  const urgencyScore = { "Urgent - ASAP": 2, "Within 1-3 months": 1, "Just researching": 0 };
  const budget = String(responses?.budget ?? "");
  const urgency = String(responses?.urgency ?? "");

  if (budget === "£15k+" && urgency === "Urgent - ASAP") return "PLATINUM";

  const score = (budgetScore[budget] ?? 0) + (urgencyScore[urgency] ?? 0);
  if (score >= 5) return "GOLD";
  if (score >= 3) return "SILVER";
  return "BRONZE";
};

const ratingRank = { BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4 };

const isLeadAvailableToPlan = (lead, plan) => {
  const country = String(lead.responses?.area ?? "").toUpperCase().replaceAll(" ", "_");
  const leadRank = ratingRank[getLeadRating(lead.responses)] ?? 0;
  const highestPlanRank = Math.max(...plan.ratings.map((rating) => ratingRank[rating] ?? 0));

  return (plan.type === "ALL_COUNTRIES" || plan.countries.includes(country))
    && leadRank <= highestPlanRank;
};

export const getBusinessLeadsCsv = async (prisma, plan) => {
  const allLeads = await prisma.lead.findMany({ where: { completed: true }, orderBy: { completedAt: "desc" } });
  const leads = allLeads.filter((lead) => isLeadAvailableToPlan(lead, plan));
  const headers = [
    "id", "name", "email", "phone", "postcode", "notes", "createdAt", "completedAt", "goal", "issue", "urgency",
    "property", "area", "budget", "estimatedValue", "consultation",
  ];
  const rows = leads.map((lead) => {
    const responses = lead.responses;
    const budget = String(responses?.budget ?? "");

    return [
      lead.id, lead.name, lead.email, lead.phone, lead.postcode, lead.notes, lead.createdAt.toISOString(), (lead.completedAt ?? lead.createdAt).toISOString(),
      responses?.goal, responses?.issue, responses?.urgency, responses?.property, responses?.area, budget,
      amountMap[budget], responses?.consultation,
    ].map(csvValue).join(",");
  });

  return [headers.map(csvValue).join(","), ...rows].join("\r\n");
};
