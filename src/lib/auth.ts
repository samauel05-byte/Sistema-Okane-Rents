import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

export { PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permissions";

const SESSION_COOKIE = "okane_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

type RolePermissions = {
  id: string;
  name: string;
  scopeAllApartments: boolean;
  manageUsers: boolean;
  manageOwners: boolean;
  manageApartments: boolean;
  managePayments: boolean;
  manageExpenses: boolean;
  viewReports: boolean;
};

export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: RolePermissions;
  apartmentIds: string[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: { role: true, apartmentAccess: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.active) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    role: session.user.role,
    apartmentIds: session.user.apartmentAccess.map((a) => a.apartmentId),
  };
}

/** Use in server components/layouts: redirects to /login when not authenticated. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function hasPermission(user: CurrentUser, permission: Permission) {
  return user.role[permission];
}

/** Use inside server actions: throws (rather than redirecting) on denial. */
export function requirePermission(user: CurrentUser, permission: Permission) {
  if (!hasPermission(user, permission)) {
    throw new Error("No tienes permiso para realizar esta acción.");
  }
}

/** Use at the top of admin-only pages: redirects home on denial. */
export function requirePagePermission(
  user: CurrentUser,
  permission: Permission
) {
  if (!hasPermission(user, permission)) redirect("/");
}

/** null = unrestricted (every apartment); otherwise the explicit allow-list. */
export function accessibleApartmentIds(user: CurrentUser): string[] | null {
  return user.role.scopeAllApartments ? null : user.apartmentIds;
}

export function canAccessApartment(user: CurrentUser, apartmentId: string) {
  const ids = accessibleApartmentIds(user);
  return ids === null || ids.includes(apartmentId);
}

/** Throws if the user isn't allowed to touch this specific apartment. */
export function requireApartmentAccess(user: CurrentUser, apartmentId: string) {
  if (!canAccessApartment(user, apartmentId)) {
    throw new Error("No tienes acceso a este apartamento.");
  }
}
