"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <h2 className="text-lg font-semibold text-rose-800">Something went wrong</h2>
        <p className="mt-2 text-sm text-rose-700">{error.message || "Unexpected application error."}</p>
        <button type="button" className="mt-3 rounded-lg border border-rose-400 px-3 py-2 text-sm font-semibold text-rose-800" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
