import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete lead.";

    return NextResponse.json(
      { success: false, message },
      { status: 404 },
    );
  }
}
