import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const sessionCookieName = "nosp_business_session";
const sessionLifetimeSeconds = 60 * 60 * 8;

type SessionUser = {
  id: string;
  name: string;
  email: string;
};

const getSessionSecret = () => {
  const secret = process.env.CUSTOMER_SESSION_SECRET;

  if (!secret) {
    throw new Error("CUSTOMER_SESSION_SECRET is not configured.");
  }

  return secret;
};

const sign = (value: string) => createHmac("sha256", getSessionSecret()).update(value).digest("base64url");

const encode = (user: SessionUser) => Buffer.from(JSON.stringify({
  ...user,
  expiresAt: Date.now() + sessionLifetimeSeconds * 1000,
}), "utf8").toString("base64url");

const decode = (value: string): SessionUser | null => {
  const [encoded, signature] = value.split(".");

  if (!encoded || !signature) return null;

  const expectedSignature = sign(encoded);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length
    || !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionUser & { expiresAt?: number };

    if (!session.id || !session.email || !session.expiresAt || session.expiresAt < Date.now()) {
      return null;
    }

    return {
      id: session.id,
      name: session.name,
      email: session.email,
    };
  } catch {
    return null;
  }
};

export const createBusinessSession = async (user: SessionUser) => {
  const cookieStore = await cookies();
  const encoded = encode(user);

  cookieStore.set(sessionCookieName, `${encoded}.${sign(encoded)}`, {
    httpOnly: true,
    maxAge: sessionLifetimeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const getAuthenticatedBusinessUser = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return null;

  const sessionUser = decode(token);

  if (!sessionUser) return null;

  return prisma.businessUser.findUnique({
    where: { id: sessionUser.id, email: sessionUser.email },
    select: {
      id: true,
      name: true,
      email: true,
      leadPlan: {
        select: {
          id: true,
          name: true,
          type: true,
          countries: true,
          ratings: true,
          monthlyPricePence: true,
          pricePerLeadPence: true,
        },
      },
      subscriptions: {
        where: { active: true },
        orderBy: { acceptedAt: "desc" },
        take: 1,
        select: {
          id: true,
          type: true,
          countries: true,
          rating: true,
          monthlyPricePence: true,
          acceptedAt: true,
        },
      },
    },
  });
};
