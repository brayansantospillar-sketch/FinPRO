import { Router, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, financialAccountsTable, profilesTable } from "@workspace/db";

const router = Router();
const KINDS = new Set(["checking", "savings", "credit_card", "cash"]);

router.get("/financial-accounts", async (_req: Request, res: Response) => {
  const rows = await db.select().from(financialAccountsTable)
    .where(eq(financialAccountsTable.householdId, res.locals.auth.householdId))
    .orderBy(desc(financialAccountsTable.createdAt));
  res.json(rows);
});

router.post("/financial-accounts", async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const kind = typeof body.kind === "string" ? body.kind : "";
  const profileId = typeof body.profileId === "string" && body.profileId ? body.profileId : null;
  if (!name || !KINDS.has(kind)) return void res.status(400).json({ message: "Dados da conta inválidos." });
  if (profileId) {
    const [profile] = await db.select({ id: profilesTable.id }).from(profilesTable)
      .where(and(eq(profilesTable.id, profileId), eq(profilesTable.householdId, res.locals.auth.householdId))).limit(1);
    if (!profile) return void res.status(400).json({ message: "Perfil inválido." });
  }
  const [created] = await db.insert(financialAccountsTable).values({
    householdId: res.locals.auth.householdId, profileId, name, kind,
    institutionName: typeof body.institutionName === "string" ? body.institutionName.trim() || null : null,
    lastFour: typeof body.lastFour === "string" ? body.lastFour.replace(/\D/g, "").slice(-4) || null : null,
    source: "manual", syncStatus: "manual",
  }).returning();
  res.status(201).json(created);
});

router.delete("/financial-accounts/:id", async (req: Request, res: Response) => {
  const [owned] = await db.select({ id: financialAccountsTable.id }).from(financialAccountsTable)
    .where(and(eq(financialAccountsTable.id, String(req.params.id)), eq(financialAccountsTable.householdId, res.locals.auth.householdId))).limit(1);
  if (!owned) return void res.status(404).json({ message: "Conta não encontrada." });
  await db.delete(financialAccountsTable).where(eq(financialAccountsTable.id, owned.id));
  res.status(204).send();
});

export default router;
