"use client";

import { categories, offerTypes, providerTypes } from "@/lib/rescue-offers";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

function tomorrowAtLocalTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function OfferForm() {
  const router = useRouter();
  const [offerType, setOfferType] = useState<(typeof offerTypes)[number]["value"]>("free");
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message: string }>(
    { kind: "idle", message: "" },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultExpiration = useMemo(() => tomorrowAtLocalTime(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        title: String(formData.get("title") ?? "").trim(),
        providerName: String(formData.get("providerName") ?? "").trim(),
        providerType: String(formData.get("providerType") ?? "").trim(),
        category: String(formData.get("category") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        city: String(formData.get("city") ?? "").trim(),
        pickupArea: String(formData.get("pickupArea") ?? "").trim(),
        offerType: String(formData.get("offerType") ?? "").trim(),
        quantity: String(formData.get("quantity") ?? "").trim(),
        contact: String(formData.get("contact") ?? "").trim(),
        discountPercent:
          String(formData.get("discountPercent") ?? "").trim().length > 0
            ? Number(formData.get("discountPercent"))
            : null,
        expiresAt: String(formData.get("expiresAt") ?? "").trim(),
      };

      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "No se pudo publicar la oferta.");
      }

      event.currentTarget.reset();
      setOfferType("free");
      setStatus({ kind: "success", message: "Oferta publicada. La comunidad la puede ver ahora mismo." });
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/60 bg-white/90 p-5 shadow-[0_24px_60px_rgba(16,24,40,0.1)] backdrop-blur">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Publicar rescate
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Comparte comida antes de tirarla</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Ideal para panaderías, restaurantes y vecinos que quieren regalar o vender con descuento lo que aún está perfecto.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del producto" name="title" placeholder="Pan del día, menú familiar, frutas mixtas" />
        <Field label="Nombre del local o vecino" name="providerName" placeholder="Panadería Aurora" />
        <SelectField label="Tipo de publicación" name="offerType" value={offerType} onChange={(value) => setOfferType(value as (typeof offerTypes)[number]["value"])} options={offerTypes} />
        <SelectField label="Tipo de comercio" name="providerType" options={providerTypes} />
        <SelectField label="Categoría" name="category" options={categories} />
        <Field label="Ciudad" name="city" placeholder="Montevideo, Córdoba, Lima..." />
        <Field label="Zona de retiro" name="pickupArea" placeholder="Centro, barrio X, esquina Y" />
        <Field label="Cantidad" name="quantity" placeholder="3 combos / 2 bolsas / 6 piezas" />
        <Field label="Contacto" name="contact" placeholder="WhatsApp, Instagram o nota privada" />
        <Field label="Vence el" name="expiresAt" type="datetime-local" defaultValue={defaultExpiration} />
        {offerType === "discount" ? (
          <Field label="Descuento %" name="discountPercent" type="number" min={1} max={95} placeholder="30" />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Si quieres publicar gratis, no necesitas indicar descuento.
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Describe el estado del producto, la hora ideal de retiro y cualquier detalle útil."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Publicando..." : "Publicar oferta"}
      </button>

      {status.kind !== "idle" ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            status.kind === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  defaultValue?: string;
};

function Field({ label, name, placeholder, type = "text", min, max, defaultValue }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        max={max}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        required
      />
    </div>
  );
}

type Option = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  name: string;
  options: readonly Option[];
  value?: string;
  onChange?: (value: string) => void;
};

function SelectField({ label, name, options, value, onChange }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        required
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
