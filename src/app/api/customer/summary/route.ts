import { NextResponse } from "next/server";

import { getAuthenticatedBusinessUser } from "@/lib/business-auth";
import { getBusinessSummary } from "@/lib/business-summary";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthenticatedBusinessUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const subscription = user.subscriptions[0];

    if (!subscription) {
      return NextResponse.json({ success: false, message: "Choose and accept a lead subscription before viewing leads." }, { status: 403 });
    }

    const summary = await getBusinessSummary(prisma, { ...subscription, ratings: [subscription.rating] });
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load business summary.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
