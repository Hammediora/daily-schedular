export type DatabaseIssue = {
  code: string;
  message: string;
};

export function getDatabaseIssue(error: unknown): DatabaseIssue | null {
  if (!error || typeof error !== "object") return null;
  const e = error as Record<string, unknown>;
  // Prisma client initialization errors (DB unreachable)
  if (
    typeof e.message === "string" &&
    (e.message.includes("Can't reach database") ||
      e.message.includes("Connection refused") ||
      e.message.includes("ECONNREFUSED") ||
      e.message.includes("PrismaClientInitializationError") ||
      String(e.errorCode ?? e.code ?? "").startsWith("P1"))
  ) {
    return {
      code: String(e.errorCode ?? e.code ?? "DB_UNAVAILABLE"),
      message: "Database is unreachable. Please try again in a moment.",
    };
  }
  return null;
}
