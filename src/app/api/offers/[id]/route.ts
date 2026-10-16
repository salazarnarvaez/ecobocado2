import { db } from "@/db";
import { rescueOffers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function serializeOffer(offer: typeof rescueOffers.$inferSelect) {
  return {
    ...offer,
    expiresAt: offer.expiresAt.toISOString(),
    createdAt: offer.createdAt.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const offerId = Number.parseInt(id, 10);

  if (!Number.isInteger(offerId)) {
    return NextResponse.json({ ok: false, error: "ID inválido." }, { status: 400 });
  }

  const current = await db
    .select({ isReserved: rescueOffers.isReserved })
    .from(rescueOffers)
    .where(eq(rescueOffers.id, offerId))
    .limit(1);

  if (!current.length) {
    return NextResponse.json({ ok: false, error: "Oferta no encontrada." }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const nextIsReserved =
    payload && typeof payload === "object" && typeof (payload as { isReserved?: unknown }).isReserved === "boolean"
      ? (payload as { isReserved: boolean }).isReserved
      : !current[0].isReserved;

  const [updated] = await db
    .update(rescueOffers)
    .set({ isReserved: nextIsReserved })
    .where(eq(rescueOffers.id, offerId))
    .returning();

  return NextResponse.json({ ok: true, offer: serializeOffer(updated) });
}
