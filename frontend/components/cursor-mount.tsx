"use client";

import dynamic from "next/dynamic";

const LazyCustomCursor = dynamic(() => import("@/components/CustomCursor").then((mod) => mod.CustomCursor), {
  ssr: false
});

export function CursorMount() {
  return <LazyCustomCursor />;
}
