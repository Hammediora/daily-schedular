import type { DatabaseIssue } from "@/lib/database-error";

export default function DatabaseUnavailableState({ issue, onRetry }: { issue: DatabaseIssue; onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
      <div className="text-center max-w-md px-6">
        <h1 className="font-serif text-3xl font-bold mb-3">Database Unavailable</h1>
        <p className="text-muted text-sm mb-2">{issue.message}</p>
        <p className="text-muted/50 text-xs">Code: {issue.code}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 font-sans text-sm px-4 py-2 border border-border rounded-lg text-muted hover:text-foreground transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
