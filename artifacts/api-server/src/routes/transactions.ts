import { Router, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, profilesTable, transactionsTable } from "@workspace/db";

const router = Router();
router.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
const TYPES = new Set(["receita", "despesa"]);
const CATEGORIES = new Set(["Alimentação","Mercado","Moradia","Transporte","Saúde","Educação","Compras","Lazer","Assinaturas","Contas","Investimentos","Salário","Outros"]);

function parseInput(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  const type = typeof value.type === "string" ? value.type : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const amountCents = typeof value.amountCents === "number" ? value.amountCents : NaN;
  const category = typeof value.category === "string" ? value.category : "";
  const date = typeof value.date === "string" ? value.date : "";
  const notes = typeof value.notes === "string" ? value.notes.trim() : "";
  const profileId = typeof value.profileId === "string" && value.profileId ? value.profileId : null;
  if (!profileId || !TYPES.has(type) || !description || !Number.isSafeInteger(amountCents) || amountCents <= 0 || !CATEGORIES.has(category) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { profileId, type, description, amountCents, category, date, notes: notes || null, updatedAt: new Date() };
}

async function ownsProfile(profileId: string, householdId: string) {
  const [row] = await db.select({ id: profilesTable.id }).from(profilesTable)
    .where(and(eq(profilesTable.id, profileId), eq(profilesTable.householdId, householdId))).limit(1);
  return Boolean(row);
}

router.get("/transactions", async (_req: Request, res: Response) => {
  const rows = await db.select({
    id: transactionsTable.id, profileId: transactionsTable.profileId, type: transactionsTable.type,
    description: transactionsTable.description, amountCents: transactionsTable.amountCents,
    category: transactionsTable.category, date: transactionsTable.date, notes: transactionsTable.notes,
    createdAt: transactionsTable.createdAt, updatedAt: transactionsTable.updatedAt,
  }).from(transactionsTable).innerJoin(profilesTable, eq(transactionsTable.profileId, profilesTable.id))
    .where(eq(profilesTable.householdId, res.locals.auth.householdId))
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt));
  res.json(rows);
});

router.post("/transactions", async (req: Request, res: Response) => {
  const input = parseInput(req.body);
  if (!input || !(await ownsProfile(input.profileId, res.locals.auth.householdId))) return void res.status(400).json({ message: "Dados do lançamento inválidos." });
  const [created] = await db.insert(transactionsTable).values(input).returning();
  res.status(201).json(created);
});

router.put("/transactions/:id", async (req: Request, res: Response) => {
  const input = parseInput(req.body);
  if (!input || !(await ownsProfile(input.profileId, res.locals.auth.householdId))) return void res.status(400).json({ message: "Dados do lançamento inválidos." });
  const [owned] = await db.select({ id: transactionsTable.id }).from(transactionsTable)
    .innerJoin(profilesTable, eq(transactionsTable.profileId, profilesTable.id))
    .where(and(eq(transactionsTable.id, String(req.params.id)), eq(profilesTable.householdId, res.locals.auth.householdId))).limit(1);
  if (!owned) return void res.status(404).json({ message: "Lançamento não encontrado." });
  const [updated] = await db.update(transactionsTable).set(input).where(eq(transactionsTable.id, owned.id)).returning();
  res.json(updated);
});

router.delete("/transactions/:id", async (req: Request, res: Response) => {
  const [owned] = await db.select({ id: transactionsTable.id }).from(transactionsTable)
    .innerJoin(profilesTable, eq(transactionsTable.profileId, profilesTable.id))
    .where(and(eq(transactionsTable.id, String(req.params.id)), eq(profilesTable.householdId, res.locals.auth.householdId))).limit(1);
  if (!owned) return void res.status(404).json({ message: "Lançamento não encontrado." });
  await db.delete(transactionsTable).where(eq(transactionsTable.id, owned.id));
  res.status(204).send();
});

export default router;
