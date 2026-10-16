"use client";

import {
  categoryLabels,
  offerTypeLabels,
  providerTypeLabels,
} from "@/lib/rescue-offers";
import { useRouter } from "next/navigation";
import { useState } from "react";

type OfferCardProps = {
  id: number;
  title: string;
  providerName: string;
  providerType: keyof typeof providerTypeLabels;
  category: keyof typeof categoryLabels;
  description: string;
  city: string;
  pickupArea: string;
  offerType: keyof typeof offerTypeLabels;
  discountPercent: number | null;
  quantity: string;
  contact: string;
  expiresAt: string;
  isReserved: boolean;
};

export function OfferCard({
  id,
  title,
  providerName,
  providerType,
  category,
  description,
  city,
  pickupArea,
  offerType,
  discountPercent,
  quantity,
  contact,
  expiresAt,
  isReserved,
}: OfferCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const expirationDate = new Date(expiresAt);

  async function toggleReserved() {
    setPending(true);

    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReserved: !isReserved }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar la publicación.");
      }

      router.refresh();
    } catch {
      // Keep the interface simple: the refresh is enough when the request works.
    } finally {
      setPending(false);
    }
  }

  return (
    <article
      className={`flex h-full flex-col rounded-3xl border p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 ${
        isReserved ? "border-amber-200 bg-amber-50/70" : "border-white/60 bg-white/95"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              {providerTypeLabels[providerType]}
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
              {categoryLabels[category]}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{providerName}</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
            offerType === "free"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-sky-100 text-sky-700"
          }`}
        >
          {offerTypeLabels[offerType]}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>

      <dl className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <Info label="Ciudad" value={city} />
        <Info label="Zona" value={pickupArea} />
        <Info label="Cantidad" value={quantity} />
        <Info
          label="Validez"
          value={expirationDate.toLocaleString("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        />
        <Info label="Contacto" value={contact || "Disponible en la app"} />
        <Info
          label="Ahorro"
          value={offerType === "discount" ? `${discountPercent ?? 0}%` : "100%"}
        />
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className={`text-sm font-medium ${isReserved ? "text-amber-700" : "text-slate-500"}`}>
          {isReserved ? "Reservado por la comunidad" : "Disponible ahora"}
        </p>
        <button
          type="button"
          onClick={toggleReserved}
          disabled={pending}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
            isReserved
              ? "bg-amber-200 text-amber-900 hover:bg-amber-300"
              : "bg-slate-950 text-white hover:bg-emerald-700"
          }`}
        >
          {pending ? "Guardando..." : isReserved ? "Liberar" : "Reservar"}
        </button>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
