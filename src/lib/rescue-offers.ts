export const providerTypes = [
  { value: "restaurant", label: "Restaurante" },
  { value: "bakery", label: "Panadería" },
  { value: "market", label: "Tienda / comercio" },
  { value: "neighbor", label: "Vecino o vecina" },
] as const;

export const offerTypes = [
  { value: "free", label: "Gratis" },
  { value: "discount", label: "Con descuento" },
] as const;

export const categories = [
  { value: "bakery", label: "Panadería" },
  { value: "prepared", label: "Comida preparada" },
  { value: "produce", label: "Frutas y verduras" },
  { value: "groceries", label: "Despensa / abarrotes" },
  { value: "other", label: "Otros" },
] as const;

export type ProviderType = (typeof providerTypes)[number]["value"];
export type OfferType = (typeof offerTypes)[number]["value"];
export type OfferCategory = (typeof categories)[number]["value"];

export const providerTypeLabels: Record<ProviderType, string> = {
  restaurant: "Restaurante",
  bakery: "Panadería",
  market: "Tienda / comercio",
  neighbor: "Vecino o vecina",
};

export const offerTypeLabels: Record<OfferType, string> = {
  free: "Gratis",
  discount: "Con descuento",
};

export const categoryLabels: Record<OfferCategory, string> = {
  bakery: "Panadería",
  prepared: "Comida preparada",
  produce: "Frutas y verduras",
  groceries: "Despensa / abarrotes",
  other: "Otros",
};

export const providerTypeValues = providerTypes.map((item) => item.value);
export const offerTypeValues = offerTypes.map((item) => item.value);
export const categoryValues = categories.map((item) => item.value);
