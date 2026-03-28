"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line } from "@react-three/drei";
import * as THREE from "three";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const nodePalette = {
  intern: "#22d3ee",
  ai: "#818cf8",
  company: "#60a5fa",
  module: "#0ea5e9"
};

const coreNodePositions = {
  intern: new THREE.Vector3(0.45, -0.7, 0.55),
  ai: new THREE.Vector3(2.5, 0.25, 0.15),
  company: new THREE.Vector3(4.4, 1.15, 0.35)
};

const moduleNodes = [
  { key: "resume", position: new THREE.Vector3(1.5, 1.95, -0.45) },
  { key: "skill-gap", position: new THREE.Vector3(3.55, 2.25, -0.25) },
  { key: "verified", position: new THREE.Vector3(5.1, 0.05, -0.35) },
  { key: "pipeline", position: new THREE.Vector3(4.25, -1.55, 0.05) },
  { key: "recommendation", position: new THREE.Vector3(2.35, -2.15, -0.35) },
  { key: "progress", position: new THREE.Vector3(0.4, -1.95, -0.45) }
] as const;

const pathwayPairs: [THREE.Vector3, THREE.Vector3][] = [
  [coreNodePositions.intern, coreNodePositions.ai],
  [coreNodePositions.ai, coreNodePositions.company],
  [coreNodePositions.intern, moduleNodes[0].position],
  [coreNodePositions.intern, moduleNodes[5].position],
  [coreNodePositions.ai, moduleNodes[1].position],
  [coreNodePositions.ai, moduleNodes[4].position],
  [coreNodePositions.company, moduleNodes[2].position],
  [coreNodePositions.company, moduleNodes[3].position],
  [moduleNodes[0].position, moduleNodes[4].position],
  [moduleNodes[3].position, moduleNodes[5].position]
];

function Pathways({ intensity }: { intensity: number }) {
  return (
    <group>
      {pathwayPairs.map((pair, idx) => (
        <Line key={`flow-line-${idx}`} points={pair} color="#38bdf8" lineWidth={1.1} transparent opacity={0.22 + intensity * 0.12} />
      ))}
    </group>
  );
}

function FlowSignals({ reducedMotion }: { reducedMotion: boolean }) {
  const particlesRef = useRef<THREE.Group>(null);
  const signalData = useMemo(() => {
    return Array.from({ length: 18 }).map((_, idx) => {
      const path = pathwayPairs[idx % pathwayPairs.length];
      return {
        start: path[0].clone(),
        end: path[1].clone(),
        progress: (idx % 6) / 6
      };
    });
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    particlesRef.current.children.forEach((child, index) => {
      const meta = signalData[index];
      if (!meta) return;
      meta.progress += delta * (reducedMotion ? 0.1 : 0.24);
      if (meta.progress > 1) meta.progress = 0;
      child.position.lerpVectors(meta.start, meta.end, meta.progress);
      const pulse = 0.75 + Math.sin((meta.progress + index) * Math.PI * 2) * 0.18;
      child.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={particlesRef}>
      {signalData.map((signal, idx) => (
        <mesh key={`signal-${idx}`} position={signal.start}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color={idx % 2 === 0 ? "#22d3ee" : "#93c5fd"} emissive="#0ea5e9" emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  );
}

function DomainNodes({ reducedMotion }: { reducedMotion: boolean }) {
  const containerRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!containerRef.current) return;
    const pointerX = state.pointer.x;
    const pointerY = state.pointer.y;
    containerRef.current.rotation.y = lerp(containerRef.current.rotation.y, pointerX * 0.12, 0.035);
    containerRef.current.rotation.x = lerp(containerRef.current.rotation.x, pointerY * 0.08, 0.035);
    if (!reducedMotion) {
      containerRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.42) * 0.07;
    }
  });

  return (
    <group ref={containerRef} position={[-1.4, 0, 0]}>
      <Float speed={0.9} floatIntensity={0.2} rotationIntensity={0.1}>
        <mesh position={coreNodePositions.intern}>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial color={nodePalette.intern} emissive="#0f766e" emissiveIntensity={0.95} roughness={0.2} metalness={0.45} />
        </mesh>
      </Float>

      <Float speed={1} floatIntensity={0.16} rotationIntensity={0.1}>
        <mesh position={coreNodePositions.ai}>
          <sphereGeometry args={[0.34, 32, 32]} />
          <meshStandardMaterial color={nodePalette.ai} emissive="#312e81" emissiveIntensity={1.05} roughness={0.18} metalness={0.55} />
        </mesh>
      </Float>

      <Float speed={0.86} floatIntensity={0.16} rotationIntensity={0.09}>
        <mesh position={coreNodePositions.company}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color={nodePalette.company} emissive="#1e3a8a" emissiveIntensity={0.9} roughness={0.22} metalness={0.45} />
        </mesh>
      </Float>

      {moduleNodes.map((module, idx) => (
        <group key={module.key} position={module.position}>
          <mesh>
            <boxGeometry args={[1.42, 0.52, 0.18]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? nodePalette.module : "#38bdf8"}
              emissive="#0c4a6e"
              emissiveIntensity={0.32}
              roughness={0.28}
              metalness={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SemanticSignalHalo({ intensity }: { intensity: number }) {
  const haloRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!haloRef.current) return;
    haloRef.current.rotation.y += delta * 0.12;
    haloRef.current.rotation.x = lerp(haloRef.current.rotation.x, state.pointer.y * 0.04, 0.02);
  });

  return (
    <group ref={haloRef} position={[1.15, 0.2, -1.2]}>
      <mesh position={[0.95, -0.25, 0]}>
        <torusGeometry args={[0.85, 0.02, 10, 90]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.16 + intensity * 0.05} />
      </mesh>
      <mesh position={[2.55, 0.52, -0.05]}>
        <torusGeometry args={[0.7, 0.018, 10, 90]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.15 + intensity * 0.05} />
      </mesh>
    </group>
  );
}

function CameraRig({ reducedMotion, onIntensity }: { reducedMotion: boolean; onIntensity: (value: number) => void }) {
  useFrame((state) => {
    const pointerMagnitude = Math.min(1, Math.sqrt(state.pointer.x * state.pointer.x + state.pointer.y * state.pointer.y));
    onIntensity(pointerMagnitude);
    const followX = reducedMotion ? state.pointer.x * 0.36 : state.pointer.x * 0.85;
    const followY = reducedMotion ? state.pointer.y * 0.24 : state.pointer.y * 0.62;
    state.camera.position.x = lerp(state.camera.position.x, 0.85 + followX, 0.045);
    state.camera.position.y = lerp(state.camera.position.y, followY, 0.05);
    state.camera.lookAt(1.1, 0, 0);
  });
  return null;
}

export function InteractiveHeroScene() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [1.2, 0, 8.8], fov: 52 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#030712"]} />
        <fog attach="fog" args={["#020617", 8, 24]} />

        <ambientLight intensity={0.55} />
        <pointLight position={[4, 5.5, 5.5]} color="#22d3ee" intensity={1.4 + intensity * 0.35} />
        <pointLight position={[-5, -2.5, 4]} color="#6366f1" intensity={1.05} />
        <pointLight position={[6.5, 1.2, 3]} color="#0ea5e9" intensity={0.55 + intensity * 0.3} />

        <CameraRig reducedMotion={reducedMotion} onIntensity={setIntensity} />
        <Pathways intensity={intensity} />
        <DomainNodes reducedMotion={reducedMotion} />
        <FlowSignals reducedMotion={reducedMotion} />
        <SemanticSignalHalo intensity={intensity} />
      </Canvas>
    </div>
  );
}
