import { QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export type Cap =
  | "assign_tasks"
  | "manage_employees"
  | "manage_permissions"
  | "create_channels"
  | "view_reports"
  | "view_all_tasks";

// Resolve the signed-in user from a session token (plain DB reads — safe in queries).
export async function userByToken(ctx: QueryCtx, token: string | undefined) {
  if (!token) return null;
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!session) return null;
  const user = await ctx.db.get(session.userId);
  return user && user.active ? user : null;
}

export async function requireUser(ctx: QueryCtx, token: string | undefined) {
  const user = await userByToken(ctx, token);
  if (!user) throw new Error("Not authenticated. Please sign in again.");
  return user;
}

export async function capsForRole(ctx: QueryCtx, role: Doc<"users">["role"]) {
  const row = await ctx.db
    .query("permissions")
    .withIndex("by_role", (q) => q.eq("role", role))
    .unique();
  return row?.caps ?? null;
}

export async function can(ctx: QueryCtx, user: Doc<"users">, cap: Cap) {
  const caps = await capsForRole(ctx, user.role);
  return Boolean(caps && caps[cap]);
}

export async function requireCap(ctx: QueryCtx, user: Doc<"users">, cap: Cap) {
  if (!(await can(ctx, user, cap))) {
    throw new Error(`Forbidden — your role (${user.role}) lacks the "${cap}" permission.`);
  }
}

// Never leak password material to the client.
export function publicUser(u: Doc<"users">) {
  return {
    id: u._id,
    email: u.email,
    name: u.name,
    role: u.role,
    title: u.title,
    active: u.active,
  };
}
