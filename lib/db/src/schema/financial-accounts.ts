import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { householdsTable } from "./auth";
import { profilesTable } from "./profiles";

export const financialAccountsTable = pgTable("financial_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").notNull().references(() => householdsTable.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id").references(() => profilesTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  institutionName: text("institution_name"),
  kind: text("kind").notNull().default("checking"),
  lastFour: text("last_four"),
  currency: text("currency").notNull().default("BRL"),
  source: text("source").notNull().default("manual"),
  provider: text("provider"),
  externalAccountId: text("external_account_id"),
  connectionId: text("connection_id"),
  balanceCents: integer("balance_cents"),
  creditLimitCents: integer("credit_limit_cents"),
  closingDay: integer("closing_day"),
  dueDay: integer("due_day"),
  syncStatus: text("sync_status").notNull().default("manual"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FinancialAccountRow = typeof financialAccountsTable.$inferSelect;
export type NewFinancialAccountRow = typeof financialAccountsTable.$inferInsert;
