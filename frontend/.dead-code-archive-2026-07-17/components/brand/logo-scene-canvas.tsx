"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function LogoOrb() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.45;
    ref.current.rotation.x = Math.sin(performance.now() * 0.001) * 0.12;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.05, 1]} />
      <meshStandardMaterial color="#1f6fff" emissive="#22d3ee" emissiveIntensity={0.35} metalness={0.35} roughness={0.25} />
    </mesh>
  );
}

export function LogoSceneCanvas() {
  return (
    <div className="h-28 w-28 overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950/70 shadow-[0_12px_30px_rgba(31,111,255,0.2)]">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.55} />
        <pointLight position={[2, 2, 2]} intensity={1.1} color="#22d3ee" />
        <LogoOrb />
      </Canvas>
    </div>
  );
}
