import { Router, type Request, type Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";

const router = Router();
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
  if (!TYPES.has(type) || !description || !Number.isSafeInteger(amountCents) || amountCents <= 0 || !CATEGORIES.has(category) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { type, description, amountCents, category, date, notes: notes || null, updatedAt: new Date() };
}

router.get("/transactions", async (_req: Request, res: Response) => {
  const rows = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt));
  res.json(rows);
});

router.post("/transactions", async (req: Request, res: Response) => {
  const input = parseInput(req.body);
  if (!input) return void res.status(400).json({ message: "Dados do lançamento inválidos." });
  const [created] = await db.insert(transactionsTable).values(input).returning();
  res.status(201).json(created);
});

router.put("/transactions/:id", async (req: Request, res: Response) => {
  const input = parseInput(req.body);
  if (!input) return void res.status(400).json({ message: "Dados do lançamento inválidos." });
  const [updated] = await db.update(transactionsTable).set(input).where(eq(transactionsTable.id, req.params.id)).returning();
  if (!updated) return void res.status(404).json({ message: "Lançamento não encontrado." });
  res.json(updated);
});

router.delete("/transactions/:id", async (req: Request, res: Response) => {
  const [deleted] = await db.delete(transactionsTable).where(eq(transactionsTable.id, req.params.id)).returning({ id: transactionsTable.id });
  if (!deleted) return void res.status(404).json({ message: "Lançamento não encontrado." });
  res.status(204).send();
});

export default router;
