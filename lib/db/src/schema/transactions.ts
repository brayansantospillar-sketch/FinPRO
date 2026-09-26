import { integer, pgTable, text, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";
import { financialAccountsTable } from "./financial-accounts";

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profilesTable.id, { onDelete: "set null" }),
  financialAccountId: uuid("financial_account_id").references(() => financialAccountsTable.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  category: text("category").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  source: text("source").notNull().default("manual"),
  externalId: text("external_id"),
  merchant: text("merchant"),
  status: text("status").notNull().default("posted"),
  installmentNumber: integer("installment_number"),
  installmentCount: integer("installment_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TransactionRow = typeof transactionsTable.$inferSelect;
export type NewTransactionRow = typeof transactionsTable.$inferInsert;
