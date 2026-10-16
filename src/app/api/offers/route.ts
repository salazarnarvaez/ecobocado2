import { db } from "@/db";
import { rescueOffers } from "@/db/schema";
import {
  categoryValues,
  offerTypeValues,
  providerTypeValues,
  type OfferCategory,
  type OfferType,
  type ProviderType,
} from "@/lib/rescue-offers";
import { and, desc, eq, like, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const providerTypeSet = new Set(providerTypeValues);
const offerTypeSet = new Set(offerTypeValues);
const categorySet = new Set(categoryValues);

function serializeOffer(offer: typeof rescueOffers.$inferSelect) {
  return {
    ...offer,
    expiresAt: offer.expiresAt.toISOString(),
    createdAt: offer.createdAt.toISOString(),
  };
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: unknown) {
  const trimmed = asTrimmedString(value);
  return trimmed.length > 0 ? trimmed : "";
}

function asPositiveInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = asTrimmedString(url.searchParams.get("q"));
  const providerType = asTrimmedString(url.searchParams.get("providerType"));
  const category = asTrimmedString(url.searchParams.get("category"));
  const city = asTrimmedString(url.searchParams.get("city"));

  const filters = [] as Array<Parameters<typeof and>[0]>;

  if (q) {
    const likePattern = `%${q}%`;
    filters.push(
      or(
        like(rescueOffers.title, likePattern),
        like(rescueOffers.providerName, likePattern),
        like(rescueOffers.city, likePattern),
        like(rescueOffers.description, likePattern),
      )!,
    );
  }

  if (providerType && providerTypeSet.has(providerType as ProviderType)) {
    filters.push(eq(rescueOffers.providerType, providerType as ProviderType));
  }

  if (category && categorySet.has(category as OfferCategory)) {
    filters.push(eq(rescueOffers.category, category as OfferCategory));
  }

  if (city) {
    filters.push(like(rescueOffers.city, `%${city}%`));
  }

  const rows = await db
    .select()
    .from(rescueOffers)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(rescueOffers.createdAt), desc(rescueOffers.expiresAt));

  return NextResponse.json({
    ok: true,
    offers: rows.map(serializeOffer),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return badRequest("El cuerpo debe ser un objeto JSON válido.");
  }

  const title = asTrimmedString((body as Record<string, unknown>).title);
  const providerName = asTrimmedString((body as Record<string, unknown>).providerName);
  const providerType = asTrimmedString((body as Record<string, unknown>).providerType);
  const category = asTrimmedString((body as Record<string, unknown>).category);
  const description = asTrimmedString((body as Record<string, unknown>).description);
  const city = asTrimmedString((body as Record<string, unknown>).city);
  const pickupArea = asTrimmedString((body as Record<string, unknown>).pickupArea);
  const offerType = asTrimmedString((body as Record<string, unknown>).offerType);
  const quantity = asTrimmedString((body as Record<string, unknown>).quantity) || "1 bolsa";
  const contact = asNullableString((body as Record<string, unknown>).contact);
  const discountPercent = asPositiveInteger((body as Record<string, unknown>).discountPercent);
  const expiresAtInput = asTrimmedString((body as Record<string, unknown>).expiresAt);

  if (!title || !providerName || !description || !city || !pickupArea || !expiresAtInput) {
    return badRequest("Faltan campos obligatorios para publicar la oferta.");
  }

  if (!providerTypeSet.has(providerType as ProviderType)) {
    return badRequest("El tipo de comercio no es válido.");
  }

  if (!categorySet.has(category as OfferCategory)) {
    return badRequest("La categoría no es válida.");
  }

  if (!offerTypeSet.has(offerType as OfferType)) {
    return badRequest("El tipo de oferta no es válido.");
  }

  const typedProviderType = providerType as ProviderType;
  const typedCategory = category as OfferCategory;
  const typedOfferType = offerType as OfferType;

  const expiresAt = new Date(expiresAtInput);
  if (Number.isNaN(expiresAt.getTime())) {
    return badRequest("La fecha de expiración no es válida.");
  }

  const now = new Date();
  if (expiresAt.getTime() <= now.getTime()) {
    return badRequest("La fecha de expiración debe ser futura.");
  }

  const values = {
    title,
    providerName,
    providerType: typedProviderType,
    category: typedCategory,
    description,
    city,
    pickupArea,
    offerType: typedOfferType,
    quantity,
    contact,
    expiresAt,
    discountPercent: typedOfferType === "discount" ? discountPercent : null,
  };

  if (typedOfferType === "discount" && values.discountPercent === null) {
    return badRequest("Si la oferta es con descuento, indica un porcentaje válido.");
  }

  const [created] = await db.insert(rescueOffers).values(values).returning();

  return NextResponse.json(
    {
      ok: true,
      offer: serializeOffer(created),
    },
    { status: 201 },
  );
}
