import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db, sessionsTable, usersTable } from "@workspace/db";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.finpro_session;
  if (typeof token !== "string" || !token) return void res.status(401).json({ message: "Faça login para continuar." });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [row] = await db.select({
    userId: usersTable.id,
    householdId: usersTable.householdId,
    email: usersTable.email,
    sessionId: sessionsTable.id,
  }).from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(and(eq(sessionsTable.tokenHash, tokenHash), gt(sessionsTable.expiresAt, new Date())))
    .limit(1);
  if (!row) return void res.status(401).json({ message: "Sua sessão expirou. Entre novamente." });
  res.locals.auth = row;
  next();
}
