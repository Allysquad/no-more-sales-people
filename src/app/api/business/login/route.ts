import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const email = String(payload?.email ?? "").trim().toLowerCase();
    const password = String(payload?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Business email and password are required." },
        { status: 400 },
      );
    }

    const user = await prisma.businessUser.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, message: "Invalid business email or password." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";

    return NextResponse.json(
      { success: false, message },
      { status: 400 },
    );
  }
}
