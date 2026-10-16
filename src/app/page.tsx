import { OfferCard } from "@/components/offer-card";
import { OfferForm } from "@/components/offer-form";
import { db } from "@/db";
import { rescueOffers } from "@/db/schema";
import {
  categoryLabels,
  categoryValues,
  offerTypeValues,
  providerTypeLabels,
  providerTypeValues,
} from "@/lib/rescue-offers";
import { and, asc, desc, eq, like, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  providerType?: string;
  category?: string;
  city?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const q = typeof resolved.q === "string" ? resolved.q.trim() : "";
  const providerType =
    typeof resolved.providerType === "string" ? resolved.providerType.trim() : "";
  const category = typeof resolved.category === "string" ? resolved.category.trim() : "";
  const city = typeof resolved.city === "string" ? resolved.city.trim() : "";

  const filters = [] as Array<unknown>;

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

  if (providerTypeValues.includes(providerType as (typeof providerTypeValues)[number])) {
    filters.push(eq(rescueOffers.providerType, providerType));
  }

  if (categoryValues.includes(category as (typeof categoryValues)[number])) {
    filters.push(eq(rescueOffers.category, category));
  }

  if (city) {
    filters.push(like(rescueOffers.city, `%${city}%`));
  }

  const rows = await db
    .select()
    .from(rescueOffers)
    .where(filters.length > 0 ? and(...(filters as [never, ...never[]])) : undefined)
    .orderBy(desc(rescueOffers.isReserved), desc(rescueOffers.createdAt), asc(rescueOffers.expiresAt));

  const offers = rows.map((offer) => ({
    id: offer.id,
    title: offer.title,
    providerName: offer.providerName,
    providerType: offer.providerType as (typeof providerTypeValues)[number],
    category: offer.category as (typeof categoryValues)[number],
    description: offer.description,
    city: offer.city,
    pickupArea: offer.pickupArea,
    offerType: offer.offerType as (typeof offerTypeValues)[number],
    discountPercent: offer.discountPercent,
    quantity: offer.quantity,
    contact: offer.contact,
    expiresAt: offer.expiresAt.toISOString(),
    isReserved: offer.isReserved,
  }));

  const stats = {
    total: offers.length,
    free: offers.filter((offer) => offer.offerType === "free").length,
    discounted: offers.filter((offer) => offer.offerType === "discount").length,
    reserved: offers.filter((offer) => offer.isReserved).length,
  };

  const hasFilters = Boolean(q || providerType || category || city);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.92))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Rescates de sobras locales
              </span>
              <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.95] text-slate-950">
                Conecta comida que sobra con gente que la quiere rescatar.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Un mercado de barrio para restaurantes, panaderías, tiendas y vecinos que quieren publicar productos
                en perfecto estado de forma gratis o con grandes descuentos. Menos desperdicio, más comunidad y más ahorro.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-700">
                <Badge>Reduce desperdicio</Badge>
                <Badge>Aumenta ventas de última hora</Badge>
                <Badge>Activa la economía local</Badge>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Publicaciones" value={stats.total.toString()} accent="emerald" />
                <StatCard label="Gratis" value={stats.free.toString()} accent="sky" />
                <StatCard label="Con descuento" value={stats.discounted.toString()} accent="amber" />
                <StatCard label="Reservadas" value={stats.reserved.toString()} accent="rose" />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Cómo funciona</p>
              <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
                <Step title="1. Publica" text="Carga lo que te sobró antes de tirarlo: pan, menús, frutas, verduras o combos de última hora." />
                <Step title="2. Filtra" text="Los vecinos encuentran publicaciones por ciudad, tipo de comercio o categoría." />
                <Step title="3. Reserva" text="Con un clic, la oferta se marca como reservada y queda lista para recoger." />
              </ol>
              <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-slate-100">
                <p className="font-semibold text-white">MVP ideal</p>
                <p className="mt-2 leading-6">
                  Primero valida el problema con una landing, publicaciones reales y una mecánica simple de reserva.
                  Luego puedes sumar pagos, geolocalización y notificaciones.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Explorar ofertas</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Encuentra lo más cercano a tu barrio</h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-slate-600">
                  Usa los filtros para buscar rápido y descubre oportunidades para comer mejor mientras ayudas a reducir residuos.
                </p>
              </div>

              <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="get">
                <InputField label="Buscar" name="q" placeholder="Pan, menú, fruta..." defaultValue={q} />
                <InputField label="Ciudad" name="city" placeholder="Montevideo" defaultValue={city} />
                <SelectField label="Comercio" name="providerType" defaultValue={providerType} options={[
                  { value: "", label: "Todos" },
                  ...providerTypeValues.map((value) => ({ value, label: providerTypeLabels[value] })),
                ]} />
                <SelectField label="Categoría" name="category" defaultValue={category} options={[
                  { value: "", label: "Todas" },
                  ...categoryValues.map((value) => ({ value, label: categoryLabels[value] })),
                ]} />
                <div className="flex items-end gap-3 xl:col-span-1">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Filtrar
                  </button>
                </div>
              </form>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {offers.length > 0 ? (
                offers.map((offer) => <OfferCard key={offer.id} {...offer} />)
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/75 p-8 text-slate-600 md:col-span-2">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {hasFilters ? "No encontramos resultados para esos filtros." : "Todavía no hay publicaciones."}
                  </h3>
                  <p className="mt-3 max-w-2xl leading-7">
                    Publica la primera oferta desde el formulario de la derecha. Si quieres, también puedes cargar ejemplos reales
                    desde la base de datos para empezar a validar la idea con tu comunidad.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <OfferForm />
          </div>
        </section>
      </div>
    </main>
  );
}

function Badge({ children }: { children: string }) {
  return <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-slate-200">{children}</span>;
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "emerald" | "sky" | "amber" | "rose" }) {
  const accentClasses: Record<typeof accent, string> = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
  };

  return (
    <div className={`rounded-3xl p-4 ring-1 ${accentClasses[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Step({ title, text }: { title: string; text: string }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-slate-300">{text}</p>
    </li>
  );
}

type InputFieldProps = {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
};

function InputField({ label, name, placeholder, defaultValue }: InputFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string }>;
};

function SelectField({ label, name, defaultValue = "", options }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
