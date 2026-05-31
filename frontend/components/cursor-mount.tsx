"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LazyCustomCursor = dynamic(() => import("@/components/CustomCursor").then((mod) => mod.CustomCursor), {
  ssr: false
});

export function CursorMount() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const enable = () => setEnabled(true);
    const idle = window.requestIdleCallback?.(enable, { timeout: 1500 });
    const fallback = window.setTimeout(enable, 1500);

    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      window.clearTimeout(fallback);
    };
  }, []);

  if (!enabled) return null;
  return <LazyCustomCursor />;
}
