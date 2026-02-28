"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
      <div className="bg-surface border border-border p-8 rounded max-w-2xl w-full">
        <h2 className="font-serif text-2xl font-bold mb-4 text-red-800">Something went wrong!</h2>
        <div className="bg-red-950/20 p-4 rounded mb-6 overflow-auto max-h-64 font-mono text-xs">
           <p className="font-bold">{error.name}: {error.message}</p>
           {error.stack && (
             <pre className="mt-2 text-muted whitespace-pre-wrap">{error.stack}</pre>
           )}
        </div>
        <button
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors"
          onClick={() => reset()}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
