import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { eq, isNull, sql } from "drizzle-orm";
import { db, householdsTable, profilesTable, sessionsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router = Router();
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

const normalizeEmail = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase() : "";
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
function verifyPassword(password: string, stored: string) {
  const [kind, saltHex, hashHex] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
async function issueSession(res: Response, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await db.insert(sessionsTable).values({ userId, tokenHash, expiresAt });
  res.cookie("finpro_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_MS, path: "/" });
}
async function publicUser(userId: string) {
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, householdId: usersTable.householdId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return user;
}

router.post("/auth/register", async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const householdName = typeof req.body?.householdName === "string" ? req.body.householdName.trim() : "Minha família";
  if (!validEmail(email) || password.length < 8 || password.length > 128) return void res.status(400).json({ message: "Use um e-mail válido e uma senha com pelo menos 8 caracteres." });
  const [exists] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (exists) return void res.status(409).json({ message: "Este e-mail já está cadastrado." });

  const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [household] = await db.insert(householdsTable).values({ name: householdName || "Minha família" }).returning();
  const [user] = await db.insert(usersTable).values({ householdId: household.id, email, passwordHash: hashPassword(password) }).returning();
  if ((countRow?.count ?? 0) === 0) {
    await db.update(profilesTable).set({ householdId: household.id, updatedAt: new Date() }).where(isNull(profilesTable.householdId));
  }
  await issueSession(res, user.id);
  res.status(201).json(await publicUser(user.id));
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) return void res.status(401).json({ message: "E-mail ou senha incorretos." });
  await issueSession(res, user.id);
  res.json(await publicUser(user.id));
});

router.post("/auth/logout", requireAuth, async (req: Request, res: Response) => {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, res.locals.auth.sessionId));
  res.clearCookie("finpro_session", { path: "/" });
  res.status(204).send();
});

router.get("/auth/me", requireAuth, async (_req: Request, res: Response) => {
  res.json(await publicUser(res.locals.auth.userId));
});

export default router;
