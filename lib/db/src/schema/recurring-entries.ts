import { boolean, date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const recurringEntriesTable = pgTable("recurring_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  category: text("category").notNull(),
  scheduleType: text("schedule_type").notNull().default("fixed_day"),
  dayOfMonth: integer("day_of_month"),
  businessDayOrdinal: integer("business_day_ordinal"),
  saturdayPolicy: text("saturday_policy").notNull().default("previous_business_day"),
  sundayPolicy: text("sunday_policy").notNull().default("next_business_day"),
  holidayPolicy: text("holiday_policy").notNull().default("previous_business_day"),
  calendarCode: text("calendar_code").notNull().default("BR-RS-PASSO_FUNDO"),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type RecurringEntryRow = typeof recurringEntriesTable.$inferSelect;
