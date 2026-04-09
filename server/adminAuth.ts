import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { admins, municipalCorps } from "@shared/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    adminId?: number;
    municipalId?: number;
  }
}

export async function seedDefaultAccounts() {
  // Seed default admin
  const existingAdmin = await db.select().from(admins).where(eq(admins.username, "dm_admin")).limit(1);
  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(admins).values({
      name: "District Magistrate",
      username: "dm_admin",
      passwordHash,
    });
    console.log("Default admin created: dm_admin / admin123");
  }

  // Seed default municipal corps
  const existingMunicipal = await db.select().from(municipalCorps).limit(1);
  if (existingMunicipal.length === 0) {
    const passwordHash = await bcrypt.hash("muni123", 10);
    await db.insert(municipalCorps).values([
      { name: "Ward 1 - Central Works Dept", username: "ward1_muni", passwordHash, ward: "Ward 1 - Central" },
      { name: "Ward 2 - North Works Dept", username: "ward2_muni", passwordHash, ward: "Ward 2 - North" },
      { name: "Ward 3 - South Works Dept", username: "ward3_muni", passwordHash, ward: "Ward 3 - South" },
    ]);
    console.log("Default municipal corps created (all use password: muni123)");
  }
}

export async function adminLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const [admin] = await db.select().from(admins).where(eq(admins.username, username));
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  (req.session as any).adminId = admin.id;
  res.json({ success: true, admin: { id: admin.id, name: admin.name, username: admin.username } });
}

export async function adminLogout(req: Request, res: Response) {
  (req.session as any).adminId = undefined;
  res.json({ success: true });
}

export async function getAdminMe(req: Request, res: Response) {
  const adminId = (req.session as any).adminId;
  if (!adminId) return res.status(401).json({ message: "Not authenticated" });
  const [admin] = await db.select().from(admins).where(eq(admins.id, adminId));
  if (!admin) return res.status(401).json({ message: "Not found" });
  res.json({ id: admin.id, name: admin.name, username: admin.username });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const adminId = (req.session as any).adminId;
  if (!adminId) return res.status(401).json({ message: "Admin authentication required" });
  next();
}

export async function municipalLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const [corp] = await db.select().from(municipalCorps).where(eq(municipalCorps.username, username));
  if (!corp) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, corp.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  (req.session as any).municipalId = corp.id;
  res.json({ success: true, municipal: { id: corp.id, name: corp.name, username: corp.username, ward: corp.ward } });
}

export async function municipalLogout(req: Request, res: Response) {
  (req.session as any).municipalId = undefined;
  res.json({ success: true });
}

export async function getMunicipalMe(req: Request, res: Response) {
  const municipalId = (req.session as any).municipalId;
  if (!municipalId) return res.status(401).json({ message: "Not authenticated" });
  const [corp] = await db.select().from(municipalCorps).where(eq(municipalCorps.id, municipalId));
  if (!corp) return res.status(401).json({ message: "Not found" });
  res.json({ id: corp.id, name: corp.name, username: corp.username, ward: corp.ward });
}

export function isMunicipal(req: Request, res: Response, next: NextFunction) {
  const municipalId = (req.session as any).municipalId;
  if (!municipalId) return res.status(401).json({ message: "Municipal authentication required" });
  next();
}
