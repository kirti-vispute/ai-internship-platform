"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line } from "@react-three/drei";
import * as THREE from "three";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const palette = {
  intern: "#22d3ee",
  ai: "#818cf8",
  company: "#60a5fa",
  moduleA: "#0ea5e9",
  moduleB: "#38bdf8"
};

const coreNodePositions = {
  intern: new THREE.Vector3(0.9, -0.85, 0.48),
  ai: new THREE.Vector3(2.8, 0.2, 0.05),
  company: new THREE.Vector3(4.9, 1.15, 0.28)
};

const moduleNodes = [
  { key: "resume-score", position: new THREE.Vector3(1.55, 2.02, -0.5) },
  { key: "skill-gap", position: new THREE.Vector3(3.7, 2.3, -0.3) },
  { key: "verified-company", position: new THREE.Vector3(5.3, 0.05, -0.38) },
  { key: "hiring-workflow", position: new THREE.Vector3(4.35, -1.62, 0.08) },
  { key: "recommendation-confidence", position: new THREE.Vector3(2.35, -2.2, -0.38) },
  { key: "application-progress", position: new THREE.Vector3(0.45, -2.0, -0.48) }
] as const;

const linearPaths: [THREE.Vector3, THREE.Vector3][] = [
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

function buildArcPath(start: THREE.Vector3, end: THREE.Vector3, lift: number) {
  const control = start.clone().add(end).multiplyScalar(0.5);
  control.y += lift;
  control.z -= 0.32;
  return new THREE.CatmullRomCurve3([start.clone(), control, end.clone()]).getPoints(28);
}

function Pathways({ intensity }: { intensity: number }) {
  const arcPaths = useMemo(
    () => [
      buildArcPath(coreNodePositions.intern, coreNodePositions.ai, 1.2),
      buildArcPath(coreNodePositions.ai, coreNodePositions.company, 1.0),
      buildArcPath(coreNodePositions.ai, moduleNodes[3].position, 0.74),
      buildArcPath(moduleNodes[0].position, moduleNodes[4].position, 0.52)
    ],
    []
  );

  return (
    <group>
      {linearPaths.map((pair, index) => (
        <Line key={`linear-${index}`} points={pair} color="#38bdf8" lineWidth={1.12} transparent opacity={0.24 + intensity * 0.14} />
      ))}
      {arcPaths.map((points, index) => (
        <Line key={`arc-${index}`} points={points} color="#7dd3fc" lineWidth={0.9} transparent opacity={0.18 + intensity * 0.14} />
      ))}
    </group>
  );
}

function FlowSignals({ reducedMotion }: { reducedMotion: boolean }) {
  const signalsRef = useRef<THREE.Group>(null);
  const signalData = useMemo(() => {
    return Array.from({ length: 22 }).map((_, idx) => {
      const path = linearPaths[idx % linearPaths.length];
      return {
        start: path[0].clone(),
        end: path[1].clone(),
        progress: (idx % 8) / 8
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (!signalsRef.current) return;
    signalsRef.current.children.forEach((child, index) => {
      const signal = signalData[index];
      if (!signal) return;
      signal.progress += delta * (reducedMotion ? 0.08 : 0.26);
      if (signal.progress > 1) signal.progress = 0;
      child.position.lerpVectors(signal.start, signal.end, signal.progress);
      const pulse = 0.72 + Math.sin((signal.progress + index) * Math.PI * 2 + state.clock.elapsedTime * 0.65) * 0.2;
      child.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={signalsRef}>
      {signalData.map((signal, index) => (
        <mesh key={`signal-${index}`} position={signal.start}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={index % 2 === 0 ? "#22d3ee" : "#93c5fd"} emissive="#22d3ee" emissiveIntensity={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function ArcSignals({ reducedMotion }: { reducedMotion: boolean }) {
  const particlesRef = useRef<THREE.Group>(null);
  const arcSignalPaths = useMemo(
    () => [
      buildArcPath(coreNodePositions.intern, coreNodePositions.ai, 1.2),
      buildArcPath(coreNodePositions.ai, coreNodePositions.company, 1.0),
      buildArcPath(coreNodePositions.ai, moduleNodes[3].position, 0.74)
    ],
    []
  );
  const arcSignalData = useMemo(() => {
    return Array.from({ length: 9 }).map((_, idx) => ({
      pathIndex: idx % arcSignalPaths.length,
      progress: (idx % 3) / 3
    }));
  }, [arcSignalPaths.length]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    particlesRef.current.children.forEach((child, index) => {
      const meta = arcSignalData[index];
      const path = arcSignalPaths[meta.pathIndex];
      meta.progress += delta * (reducedMotion ? 0.06 : 0.17);
      if (meta.progress > 1) meta.progress = 0;
      const point = path[Math.floor(meta.progress * (path.length - 1))];
      child.position.copy(point);
      const wobble = 0.8 + Math.sin(state.clock.elapsedTime * 1.45 + index) * 0.12;
      child.scale.setScalar(wobble);
    });
  });

  return (
    <group ref={particlesRef}>
      {arcSignalData.map((_, index) => (
        <mesh key={`arc-signal-${index}`}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function DomainNodes({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, state.pointer.x * 0.11, 0.035);
    groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, state.pointer.y * 0.08, 0.035);
    groupRef.current.position.x = lerp(groupRef.current.position.x, 0, 0.05);
    if (!reducedMotion) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.43) * 0.08;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.22) * 0.02;
    }
    groupRef.current.children.forEach((child, index) => {
      child.rotation.y += delta * (0.08 + index * 0.008);
    });
  });

  return (
    <group ref={groupRef} position={[-1.25, 0, 0]}>
      <Float speed={1} floatIntensity={0.2} rotationIntensity={0.08}>
        <mesh position={coreNodePositions.intern}>
          <sphereGeometry args={[0.29, 34, 34]} />
          <meshPhysicalMaterial color={palette.intern} emissive="#0891b2" emissiveIntensity={1.15} roughness={0.18} metalness={0.48} clearcoat={0.8} />
        </mesh>
      </Float>

      <Float speed={1.05} floatIntensity={0.18} rotationIntensity={0.08}>
        <mesh position={coreNodePositions.ai}>
          <sphereGeometry args={[0.36, 34, 34]} />
          <meshPhysicalMaterial color={palette.ai} emissive="#4338ca" emissiveIntensity={1.22} roughness={0.18} metalness={0.52} clearcoat={0.86} />
        </mesh>
      </Float>

      <Float speed={0.94} floatIntensity={0.16} rotationIntensity={0.08}>
        <mesh position={coreNodePositions.company}>
          <sphereGeometry args={[0.32, 34, 34]} />
          <meshPhysicalMaterial color={palette.company} emissive="#1d4ed8" emissiveIntensity={1.08} roughness={0.2} metalness={0.5} clearcoat={0.82} />
        </mesh>
      </Float>

      {moduleNodes.map((module, index) => (
        <mesh key={module.key} position={module.position}>
          <boxGeometry args={[1.34, 0.5, 0.16]} />
          <meshPhysicalMaterial
            color={index % 2 === 0 ? palette.moduleA : palette.moduleB}
            emissive="#0c4a6e"
            emissiveIntensity={0.38}
            roughness={0.22}
            metalness={0.58}
            clearcoat={0.64}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

function SemanticGlowLayers({ intensity }: { intensity: number }) {
  const haloGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!haloGroupRef.current) return;
    haloGroupRef.current.rotation.y += delta * 0.1;
    haloGroupRef.current.rotation.x = lerp(haloGroupRef.current.rotation.x, state.pointer.y * 0.04, 0.03);
  });

  return (
    <group ref={haloGroupRef} position={[1.4, 0.2, -1.3]}>
      <mesh position={[0.95, -0.28, 0]}>
        <torusGeometry args={[0.88, 0.022, 12, 100]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18 + intensity * 0.06} />
      </mesh>
      <mesh position={[2.58, 0.56, -0.05]}>
        <torusGeometry args={[0.74, 0.018, 12, 100]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.16 + intensity * 0.06} />
      </mesh>
      <mesh position={[4.05, -1.52, 0.08]}>
        <torusGeometry args={[0.8, 0.018, 12, 100]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.14 + intensity * 0.06} />
      </mesh>
    </group>
  );
}

function CameraRig({ reducedMotion, onIntensity }: { reducedMotion: boolean; onIntensity: (value: number) => void }) {
  useFrame((state) => {
    const magnitude = Math.min(1, Math.hypot(state.pointer.x, state.pointer.y));
    onIntensity(magnitude);
    const followX = reducedMotion ? state.pointer.x * 0.32 : state.pointer.x * 0.88;
    const followY = reducedMotion ? state.pointer.y * 0.22 : state.pointer.y * 0.65;
    state.camera.position.x = lerp(state.camera.position.x, 1.15 + followX, 0.045);
    state.camera.position.y = lerp(state.camera.position.y, followY, 0.05);
    state.camera.lookAt(1.25, 0, 0);
  });
  return null;
}

function DynamicLighting({ intensity }: { intensity: number }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    const wave = 0.78 + Math.sin(state.clock.elapsedTime * 0.92) * 0.12;
    lightRef.current.intensity = 1.35 + intensity * 0.46 + wave;
  });

  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#7dd3fc", "#020617", 0.45]} />
      <pointLight ref={lightRef} position={[4.2, 5.8, 5.3]} color="#22d3ee" intensity={1.6} />
      <pointLight position={[-5.2, -2.7, 4.2]} color="#6366f1" intensity={1.18} />
      <pointLight position={[6.6, 1.2, 3.1]} color="#0ea5e9" intensity={0.9} />
    </>
  );
}

export function InteractiveHeroScene() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [1.25, 0, 8.9], fov: 50 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 7.5, 26]} />

        <DynamicLighting intensity={intensity} />
        <CameraRig reducedMotion={reducedMotion} onIntensity={setIntensity} />
        <Pathways intensity={intensity} />
        <DomainNodes reducedMotion={reducedMotion} />
        <FlowSignals reducedMotion={reducedMotion} />
        <ArcSignals reducedMotion={reducedMotion} />
        <SemanticGlowLayers intensity={intensity} />
      </Canvas>
    </div>
  );
}

