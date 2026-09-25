import { Router, type Request, type Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, profilesTable, recurringEntriesTable } from "@workspace/db";

const router = Router();
const TYPES = new Set(["receita", "despesa"]);
const CATEGORIES = new Set(["Alimentação","Mercado","Moradia","Transporte","Saúde","Educação","Compras","Lazer","Assinaturas","Contas","Investimentos","Salário","Outros"]);
const SCHEDULES = new Set(["fixed_day", "business_day"]);
const POLICIES = new Set(["previous_business_day", "next_business_day"]);

function parseInput(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const v = body as Record<string, unknown>;
  const profileId = typeof v.profileId === "string" ? v.profileId : "";
  const type = typeof v.type === "string" ? v.type : "";
  const description = typeof v.description === "string" ? v.description.trim() : "";
  const amountCents = typeof v.amountCents === "number" ? v.amountCents : NaN;
  const category = typeof v.category === "string" ? v.category : "";
  const scheduleType = typeof v.scheduleType === "string" ? v.scheduleType : "fixed_day";
  const dayOfMonth = typeof v.dayOfMonth === "number" ? v.dayOfMonth : null;
  const businessDayOrdinal = typeof v.businessDayOrdinal === "number" ? v.businessDayOrdinal : null;
  const saturdayPolicy = typeof v.saturdayPolicy === "string" ? v.saturdayPolicy : "previous_business_day";
  const sundayPolicy = typeof v.sundayPolicy === "string" ? v.sundayPolicy : "next_business_day";
  const holidayPolicy = typeof v.holidayPolicy === "string" ? v.holidayPolicy : "previous_business_day";
  const startsOn = typeof v.startsOn === "string" ? v.startsOn : "";
  const endsOn = typeof v.endsOn === "string" && v.endsOn ? v.endsOn : null;
  const notes = typeof v.notes === "string" ? v.notes.trim() : "";
  const active = typeof v.active === "boolean" ? v.active : true;
  const scheduleValid = SCHEDULES.has(scheduleType) &&
    (scheduleType === "fixed_day" ? Number.isInteger(dayOfMonth) && dayOfMonth! >= 1 && dayOfMonth! <= 31 : Number.isInteger(businessDayOrdinal) && businessDayOrdinal! >= 1 && businessDayOrdinal! <= 23);
  if (!profileId || !TYPES.has(type) || !description || !Number.isSafeInteger(amountCents) || amountCents <= 0 || !CATEGORIES.has(category) || !scheduleValid || !POLICIES.has(saturdayPolicy) || !POLICIES.has(sundayPolicy) || !POLICIES.has(holidayPolicy) || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || (endsOn && !/^\d{4}-\d{2}-\d{2}$/.test(endsOn))) return null;
  return { profileId, type, description, amountCents, category, scheduleType, dayOfMonth: scheduleType === "fixed_day" ? dayOfMonth : null, businessDayOrdinal: scheduleType === "business_day" ? businessDayOrdinal : null, saturdayPolicy, sundayPolicy, holidayPolicy, calendarCode: "BR-RS-PASSO_FUNDO", startsOn, endsOn, notes: notes || null, active, updatedAt: new Date() };
}
async function ownsProfile(profileId: string, householdId: string) {
  const [row] = await db.select({ id: profilesTable.id }).from(profilesTable).where(and(eq(profilesTable.id, profileId), eq(profilesTable.householdId, householdId))).limit(1);
  return Boolean(row);
}

router.get("/recurring-entries", async (_req: Request, res: Response) => {
  const rows = await db.select({
    id: recurringEntriesTable.id, profileId: recurringEntriesTable.profileId, type: recurringEntriesTable.type,
    description: recurringEntriesTable.description, amountCents: recurringEntriesTable.amountCents, category: recurringEntriesTable.category,
    scheduleType: recurringEntriesTable.scheduleType, dayOfMonth: recurringEntriesTable.dayOfMonth, businessDayOrdinal: recurringEntriesTable.businessDayOrdinal,
    saturdayPolicy: recurringEntriesTable.saturdayPolicy, sundayPolicy: recurringEntriesTable.sundayPolicy, holidayPolicy: recurringEntriesTable.holidayPolicy,
    calendarCode: recurringEntriesTable.calendarCode, startsOn: recurringEntriesTable.startsOn, endsOn: recurringEntriesTable.endsOn,
    active: recurringEntriesTable.active, notes: recurringEntriesTable.notes, createdAt: recurringEntriesTable.createdAt, updatedAt: recurringEntriesTable.updatedAt,
  }).from(recurringEntriesTable).innerJoin(profilesTable, eq(recurringEntriesTable.profileId, profilesTable.id))
    .where(eq(profilesTable.householdId, res.locals.auth.householdId))
    .orderBy(asc(recurringEntriesTable.createdAt));
  res.json(rows);
});
router.post("/recurring-entries", async (req: Request, res: Response) => {
  const input = parseInput(req.body);
  if (!input || !(await ownsProfile(input.profileId, res.locals.auth.householdId))) return void res.status(400).json({ message: "Dados da recorrência inválidos." });
  const [created] = await db.insert(recurringEntriesTable).values(input).returning();
  res.status(201).json(created);
});
router.put("/recurring-entries/:id", async (req: Request, res: Response) => {
  const input = parseInput(req.body);
  if (!input || !(await ownsProfile(input.profileId, res.locals.auth.householdId))) return void res.status(400).json({ message: "Dados da recorrência inválidos." });
  const [owned] = await db.select({ id: recurringEntriesTable.id }).from(recurringEntriesTable)
    .innerJoin(profilesTable, eq(recurringEntriesTable.profileId, profilesTable.id))
    .where(and(eq(recurringEntriesTable.id, String(req.params.id)), eq(profilesTable.householdId, res.locals.auth.householdId))).limit(1);
  if (!owned) return void res.status(404).json({ message: "Recorrência não encontrada." });
  const [updated] = await db.update(recurringEntriesTable).set(input).where(eq(recurringEntriesTable.id, owned.id)).returning();
  res.json(updated);
});
router.delete("/recurring-entries/:id", async (req: Request, res: Response) => {
  const [owned] = await db.select({ id: recurringEntriesTable.id }).from(recurringEntriesTable)
    .innerJoin(profilesTable, eq(recurringEntriesTable.profileId, profilesTable.id))
    .where(and(eq(recurringEntriesTable.id, String(req.params.id)), eq(profilesTable.householdId, res.locals.auth.householdId))).limit(1);
  if (!owned) return void res.status(404).json({ message: "Recorrência não encontrada." });
  await db.delete(recurringEntriesTable).where(eq(recurringEntriesTable.id, owned.id));
  res.status(204).send();
});
export default router;
