import { NextResponse } from "next/server";

import { getAuthenticatedBusinessUser } from "@/lib/business-auth";
import { getSubscriptionOptions, calculateSubscription } from "@/lib/subscription-pricing";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthenticatedBusinessUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    options: getSubscriptionOptions(),
    subscription: user.subscriptions[0] ?? null,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedBusinessUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const payload = await request.json();
    if (payload?.acceptPrice !== true) {
      return NextResponse.json({ success: false, message: "Accept the displayed monthly price to continue." }, { status: 400 });
    }

    const calculated = calculateSubscription({
      type: String(payload?.type ?? ""),
      countries: Array.isArray(payload?.countries) ? payload.countries.map(String) : [],
      rating: String(payload?.rating ?? ""),
    });

    const subscription = await prisma.$transaction(async (transaction) => {
      await transaction.leadSubscription.updateMany({
        where: { businessUserId: user.id, active: true },
        data: { active: false },
      });

      return transaction.leadSubscription.create({
        data: {
          businessUserId: user.id,
          type: calculated.type,
          countries: calculated.countries,
          rating: calculated.rating,
          monthlyPricePence: calculated.monthlyPricePence,
          acceptedAt: new Date(),
        },
        select: {
          id: true,
          type: true,
          countries: true,
          rating: true,
          monthlyPricePence: true,
          acceptedAt: true,
        },
      });
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save subscription.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
