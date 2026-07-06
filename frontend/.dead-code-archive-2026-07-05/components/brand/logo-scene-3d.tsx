"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const LogoSceneCanvas = dynamic(() => import("./logo-scene-canvas").then((mod) => mod.LogoSceneCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/60">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-gradient-to-br from-primary-500 to-cyan-400" />
    </div>
  )
});

export function LogoScene3D({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Suspense fallback={null}>
        <LogoSceneCanvas />
      </Suspense>
    </div>
  );
}
