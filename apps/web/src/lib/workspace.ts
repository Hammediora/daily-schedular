import { db } from "@operator-os/db";

export interface ResolveWorkspaceOptions {
  requireAuth?: boolean;
  allowSeedFallback?: boolean;
}

function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export async function resolveWorkspaceForRequest(options: ResolveWorkspaceOptions = {}) {
  const requireAuth = options.requireAuth ?? true;
  const allowSeedFallback = options.allowSeedFallback ?? true;

  if (isClerkConfigured()) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId && requireAuth) {
      return null;
    }

    if (userId) {
      const user = await db.user.findUnique({ where: { clerkId: userId } });
      if (!user) {
        return null;
      }

      const membership = await db.workspaceMember.findFirst({
        where: { userId: user.id },
        include: { workspace: true },
        orderBy: { role: "asc" },
      });

      if (membership?.workspace) {
        return membership.workspace;
      }

      return null;
    }
  }

  if (!allowSeedFallback) {
    return null;
  }

  return db.workspace.findFirst();
}
