import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rescueOffers = sqliteTable("rescue_offers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  providerName: text("provider_name").notNull(),
  providerType: text("provider_type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  pickupArea: text("pickup_area").notNull(),
  offerType: text("offer_type").notNull(),
  discountPercent: integer("discount_percent"),
  quantity: text("quantity").notNull().default("1 bolsa"),
  contact: text("contact").notNull().default(""),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  isReserved: integer("is_reserved", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type RescueOffer = typeof rescueOffers.$inferSelect;
export type NewRescueOffer = typeof rescueOffers.$inferInsert;

