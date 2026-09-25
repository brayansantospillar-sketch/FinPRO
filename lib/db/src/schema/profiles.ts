import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { householdsTable } from "./auth";

export const profilesTable = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").references(() => householdsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull().default("Membro"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ProfileRow = typeof profilesTable.$inferSelect;
export type NewProfileRow = typeof profilesTable.$inferInsert;
