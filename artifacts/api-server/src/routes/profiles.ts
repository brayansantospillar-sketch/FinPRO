import { Router, type Request, type Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";

const router = Router();

router.get("/profiles", async (_req: Request, res: Response) => {
  const rows = await db.select().from(profilesTable)
    .where(eq(profilesTable.householdId, res.locals.auth.householdId))
    .orderBy(asc(profilesTable.createdAt));
  res.json(rows);
});

router.post("/profiles", async (req: Request, res: Response) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const role = typeof req.body?.role === "string" ? req.body.role.trim() : "Membro";
  if (!name || name.length > 80 || role.length > 40) return void res.status(400).json({ message: "Dados do perfil inválidos." });
  const [created] = await db.insert(profilesTable).values({ householdId: res.locals.auth.householdId, name, role: role || "Membro" }).returning();
  res.status(201).json(created);
});

router.put("/profiles/:id", async (req: Request, res: Response) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const role = typeof req.body?.role === "string" ? req.body.role.trim() : "Membro";
  if (!name || name.length > 80 || role.length > 40) return void res.status(400).json({ message: "Dados do perfil inválidos." });
  const [updated] = await db.update(profilesTable).set({ name, role: role || "Membro", updatedAt: new Date() })
    .where(and(eq(profilesTable.id, String(req.params.id)), eq(profilesTable.householdId, res.locals.auth.householdId))).returning();
  if (!updated) return void res.status(404).json({ message: "Perfil não encontrado." });
  res.json(updated);
});

export default router;
