import { NextResponse } from "next/server";

import { getAuthenticatedBusinessUser } from "@/lib/business-auth";
import { getBusinessLeadsCsv } from "@/lib/business-export";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthenticatedBusinessUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const subscription = user.subscriptions[0];

    if (!subscription) {
      return NextResponse.json({ success: false, message: "Choose and accept a lead subscription before exporting leads." }, { status: 403 });
    }

    const csv = await getBusinessLeadsCsv(prisma, { ...subscription, ratings: [subscription.rating] });
    return new NextResponse(csv, {
      headers: {
        "Content-Disposition": "attachment; filename=leads.csv",
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export leads.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
