import { Router, type Request, type Response } from "express";
import { asc, eq } from "drizzle-orm";
import { db, recurringEntriesTable } from "@workspace/db";

const router = Router();
const TYPES = new Set(["receita", "despesa"]);
const CATEGORIES = new Set(["Alimentação","Mercado","Moradia","Transporte","Saúde","Educação","Compras","Lazer","Assinaturas","Contas","Investimentos","Salário","Outros"]);

function parseInput(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const v = body as Record<string, unknown>;
  const profileId = typeof v.profileId === "string" ? v.profileId : "";
  const type = typeof v.type === "string" ? v.type : "";
  const description = typeof v.description === "string" ? v.description.trim() : "";
  const amountCents = typeof v.amountCents === "number" ? v.amountCents : NaN;
  const category = typeof v.category === "string" ? v.category : "";
  const dayOfMonth = typeof v.dayOfMonth === "number" ? v.dayOfMonth : NaN;
  const startsOn = typeof v.startsOn === "string" ? v.startsOn : "";
  const endsOn = typeof v.endsOn === "string" && v.endsOn ? v.endsOn : null;
  const notes = typeof v.notes === "string" ? v.notes.trim() : "";
  const active = typeof v.active === "boolean" ? v.active : true;
  if (!profileId || !TYPES.has(type) || !description || !Number.isSafeInteger(amountCents) || amountCents <= 0 || !CATEGORIES.has(category) || !Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31 || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || (endsOn && !/^\d{4}-\d{2}-\d{2}$/.test(endsOn))) return null;
  return { profileId, type, description, amountCents, category, dayOfMonth, startsOn, endsOn, notes: notes || null, active, updatedAt: new Date() };
}

router.get("/recurring-entries", async (_req: Request, res: Response) => {
  const rows = await db.select().from(recurringEntriesTable).orderBy(asc(recurringEntriesTable.dayOfMonth));
  res.json(rows);
});
router.post("/recurring-entries", async (req: Request, res: Response) => {
  const input = parseInput(req.body);
  if (!input) return void res.status(400).json({ message: "Dados da recorrência inválidos." });
  const [created] = await db.insert(recurringEntriesTable).values(input).returning();
  res.status(201).json(created);
});
router.put("/recurring-entries/:id", async (req: Request, res: Response) => {
  const input = parseInput(req.body);
  if (!input) return void res.status(400).json({ message: "Dados da recorrência inválidos." });
  const [updated] = await db.update(recurringEntriesTable).set(input).where(eq(recurringEntriesTable.id, String(req.params.id))).returning();
  if (!updated) return void res.status(404).json({ message: "Recorrência não encontrada." });
  res.json(updated);
});
router.delete("/recurring-entries/:id", async (req: Request, res: Response) => {
  const [deleted] = await db.delete(recurringEntriesTable).where(eq(recurringEntriesTable.id, String(req.params.id))).returning({ id: recurringEntriesTable.id });
  if (!deleted) return void res.status(404).json({ message: "Recorrência não encontrada." });
  res.status(204).send();
});
export default router;
