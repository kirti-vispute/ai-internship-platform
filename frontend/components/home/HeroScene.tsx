"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const positions = {
  resume: new THREE.Vector3(-2.7, 0.8, 0.1),
  ai: new THREE.Vector3(-0.4, 0.1, 0.25),
  score: new THREE.Vector3(1.85, 1.15, 0.05),
  company: new THREE.Vector3(2.8, 0, 0.05),
  pipeline: new THREE.Vector3(2.1, -1.3, 0.05)
};

const connections: [THREE.Vector3, THREE.Vector3][] = [
  [positions.resume, positions.ai],
  [positions.ai, positions.score],
  [positions.ai, positions.company],
  [positions.ai, positions.pipeline]
];

function buildCurvedPath(start: THREE.Vector3, end: THREE.Vector3, lift = 0.42) {
  const control = start.clone().add(end).multiplyScalar(0.5);
  control.y += lift;
  return new THREE.CatmullRomCurve3([start.clone(), control, end.clone()]).getPoints(32);
}

function ResumeNode() {
  return (
    <group position={positions.resume}>
      <mesh>
        <boxGeometry args={[1.1, 0.88, 0.1]} />
        <meshPhysicalMaterial color="#3b82f6" emissive="#0c4a6e" emissiveIntensity={0.5} roughness={0.24} metalness={0.52} clearcoat={0.6} transparent opacity={0.94} />
      </mesh>
      <mesh position={[0, 0.24, 0.06]}>
        <boxGeometry args={[0.66, 0.05, 0.01]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0, 0.09, 0.06]}>
        <boxGeometry args={[0.74, 0.05, 0.01]} />
        <meshBasicMaterial color="#bae6fd" />
      </mesh>
      <mesh position={[0, -0.06, 0.06]}>
        <boxGeometry args={[0.7, 0.05, 0.01]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0, -0.21, 0.06]}>
        <boxGeometry args={[0.52, 0.05, 0.01]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
      <mesh position={[0.43, 0.36, 0.06]}>
        <boxGeometry args={[0.13, 0.13, 0.01]} />
        <meshBasicMaterial color="#dbeafe" />
      </mesh>
    </group>
  );
}

function AIEngineNode({ focus }: { focus: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringARef.current) ringARef.current.rotation.y += delta * 0.54;
    if (ringBRef.current) ringBRef.current.rotation.x += delta * 0.33;
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.65) * 0.07;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.y += delta * 0.26;
      const mat = coreRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 1.1 + focus * 1.2;
    }
  });

  return (
    <group position={positions.ai}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.52, 40, 40]} />
        <meshPhysicalMaterial color="#818cf8" emissive="#4338ca" emissiveIntensity={1.25} roughness={0.14} metalness={0.62} clearcoat={0.82} />
      </mesh>
      <mesh ref={ringARef} rotation={[0.25, 0.2, 0]}>
        <torusGeometry args={[0.88, 0.024, 12, 100]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.52} />
      </mesh>
      <mesh ref={ringBRef} rotation={[1.05, 0.2, 0.5]}>
        <torusGeometry args={[1.03, 0.017, 12, 100]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function ScoreNode() {
  return (
    <group position={positions.score}>
      <mesh>
        <boxGeometry args={[1.08, 0.8, 0.08]} />
        <meshPhysicalMaterial color="#0ea5e9" emissive="#0c4a6e" emissiveIntensity={0.5} roughness={0.24} metalness={0.54} clearcoat={0.58} />
      </mesh>
      <mesh position={[-0.22, 0.12, 0.05]}>
        <boxGeometry args={[0.18, 0.2, 0.01]} />
        <meshBasicMaterial color="#dbeafe" />
      </mesh>
      <mesh position={[0, 0.06, 0.05]}>
        <boxGeometry args={[0.18, 0.34, 0.01]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0.22, 0, 0.05]}>
        <boxGeometry args={[0.18, 0.44, 0.01]} />
        <meshBasicMaterial color="#2563eb" />
      </mesh>
      <mesh position={[0, -0.21, 0.05]}>
        <boxGeometry args={[0.58, 0.05, 0.01]} />
        <meshBasicMaterial color="#7dd3fc" />
      </mesh>
    </group>
  );
}

function CompanyNode() {
  return (
    <group position={positions.company}>
      <mesh>
        <boxGeometry args={[1.12, 0.8, 0.08]} />
        <meshPhysicalMaterial color="#60a5fa" emissive="#1e3a8a" emissiveIntensity={0.48} roughness={0.24} metalness={0.52} clearcoat={0.56} />
      </mesh>
      <mesh position={[0, 0.22, 0.05]}>
        <boxGeometry args={[0.72, 0.06, 0.01]} />
        <meshBasicMaterial color="#dbeafe" />
      </mesh>
      <mesh position={[0, 0.05, 0.05]}>
        <boxGeometry args={[0.76, 0.06, 0.01]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
      <mesh position={[0, -0.12, 0.05]}>
        <boxGeometry args={[0.52, 0.06, 0.01]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0.34, 0.18, 0.052]}>
        <cylinderGeometry args={[0.1, 0.1, 0.03, 20]} />
        <meshBasicMaterial color="#86efac" />
      </mesh>
    </group>
  );
}

function PipelineNode() {
  return (
    <group position={positions.pipeline}>
      <mesh>
        <boxGeometry args={[1.34, 0.84, 0.08]} />
        <meshPhysicalMaterial color="#38bdf8" emissive="#0e7490" emissiveIntensity={0.44} roughness={0.24} metalness={0.54} clearcoat={0.56} />
      </mesh>
      <mesh position={[-0.3, 0.12, 0.05]}>
        <boxGeometry args={[0.25, 0.1, 0.01]} />
        <meshBasicMaterial color="#dbeafe" />
      </mesh>
      <mesh position={[0, 0.12, 0.05]}>
        <boxGeometry args={[0.25, 0.1, 0.01]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0.3, 0.12, 0.05]}>
        <boxGeometry args={[0.25, 0.1, 0.01]} />
        <meshBasicMaterial color="#2563eb" />
      </mesh>
      <mesh position={[-0.15, 0.12, 0.055]}>
        <boxGeometry args={[0.08, 0.018, 0.01]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0.15, 0.12, 0.055]}>
        <boxGeometry args={[0.08, 0.018, 0.01]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
    </group>
  );
}

function FlowLines({ focus }: { focus: number }) {
  const curvePoints = useMemo(() => connections.map(([a, b], idx) => buildCurvedPath(a, b, idx === 0 ? 0.45 : 0.32)), []);

  return (
    <group>
      {curvePoints.map((points, index) => (
        <Line key={`line-${index}`} points={points} color="#38bdf8" lineWidth={1.3} transparent opacity={0.24 + focus * 0.16} />
      ))}
    </group>
  );
}

function FlowParticles({ reducedMotion }: { reducedMotion: boolean }) {
  const particlesRef = useRef<THREE.Group>(null);
  const paths = useMemo(() => connections.map(([a, b], idx) => buildCurvedPath(a, b, idx === 0 ? 0.45 : 0.32)), []);
  const meta = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        pathIdx: i % paths.length,
        progress: (i % 4) / 4
      })),
    [paths.length]
  );

  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    particlesRef.current.children.forEach((child, idx) => {
      const m = meta[idx];
      const path = paths[m.pathIdx];
      m.progress += delta * (reducedMotion ? 0.07 : 0.2);
      if (m.progress > 1) m.progress = 0;
      const point = path[Math.floor(m.progress * (path.length - 1))];
      child.position.copy(point);
      child.scale.setScalar(0.8 + Math.sin(state.clock.elapsedTime * 1.45 + idx) * 0.14);
    });
  });

  return (
    <group ref={particlesRef}>
      {meta.map((_, idx) => (
        <mesh key={`p-${idx}`}>
          <sphereGeometry args={[0.042, 10, 10]} />
          <meshStandardMaterial color={idx % 2 ? "#67e8f9" : "#93c5fd"} emissive="#22d3ee" emissiveIntensity={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function SceneGroup({ reducedMotion, onFocus, focus }: { reducedMotion: boolean; onFocus: (n: number) => void; focus: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const pointer = state.pointer;
    const proximity = Math.max(0, 1 - Math.min(1, Math.hypot(pointer.x, pointer.y) / 0.55));
    onFocus(proximity);

    if (groupRef.current) {
      groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, pointer.x * 0.14, 0.04);
      groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, pointer.y * 0.08, 0.04);
      if (!reducedMotion) {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.42) * 0.05;
      }
    }

    state.camera.position.x = lerp(state.camera.position.x, pointer.x * 0.42, 0.035);
    state.camera.position.y = lerp(state.camera.position.y, pointer.y * 0.28, 0.04);
    state.camera.lookAt(0.4, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <ResumeNode />
      <AIEngineNode focus={focus} />
      <ScoreNode />
      <CompanyNode />
      <PipelineNode />
      <FlowLines focus={focus} />
      <FlowParticles reducedMotion={reducedMotion} />
    </group>
  );
}

function Lights({ focus }: { focus: number }) {
  const mainRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!mainRef.current) return;
    const pulse = 0.78 + Math.sin(state.clock.elapsedTime * 1.3) * 0.14;
    mainRef.current.intensity = 1.35 + focus * 1.05 + pulse;
  });

  return (
    <>
      <ambientLight intensity={0.43} />
      <hemisphereLight args={["#7dd3fc", "#020617", 0.45]} />
      <pointLight ref={mainRef} position={[0.2, 1.7, 4.1]} color="#818cf8" intensity={2} />
      <pointLight position={[-3.2, 1.4, 2.9]} color="#22d3ee" intensity={1.05} />
      <pointLight position={[4.2, -1.3, 2.4]} color="#60a5fa" intensity={0.98} />
    </>
  );
}

export function HeroScene() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [focus, setFocus] = useState(0.6);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0.1, 0, 8.4], fov: 46 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 7, 18]} />
        <Lights focus={focus} />
        <SceneGroup reducedMotion={reducedMotion} onFocus={setFocus} focus={focus} />
      </Canvas>
    </div>
  );
}
