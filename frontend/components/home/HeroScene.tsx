"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line } from "@react-three/drei";
import * as THREE from "three";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const nodePositions = {
  resume: new THREE.Vector3(-2.8, 0.8, 0.2),
  ai: new THREE.Vector3(-0.6, 0, 0.3),
  score: new THREE.Vector3(1.15, 1.05, 0.16),
  company: new THREE.Vector3(2.55, 0.1, 0.1),
  pipeline: new THREE.Vector3(3.35, -1.15, 0.12)
};

const connections: [THREE.Vector3, THREE.Vector3][] = [
  [nodePositions.resume, nodePositions.ai],
  [nodePositions.ai, nodePositions.score],
  [nodePositions.ai, nodePositions.company],
  [nodePositions.score, nodePositions.company],
  [nodePositions.company, nodePositions.pipeline],
  [nodePositions.ai, nodePositions.pipeline]
];

function ResumeNode() {
  return (
    <Float speed={1.02} floatIntensity={0.16} rotationIntensity={0.06}>
      <group position={nodePositions.resume}>
        <mesh>
          <boxGeometry args={[1.05, 0.82, 0.09]} />
          <meshPhysicalMaterial color="#38bdf8" emissive="#075985" emissiveIntensity={0.5} roughness={0.26} metalness={0.5} clearcoat={0.58} transparent opacity={0.94} />
        </mesh>
        <mesh position={[0, 0.2, 0.05]}>
          <boxGeometry args={[0.62, 0.05, 0.01]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[0, 0.05, 0.05]}>
          <boxGeometry args={[0.72, 0.05, 0.01]} />
          <meshBasicMaterial color="#bae6fd" />
        </mesh>
        <mesh position={[0, -0.1, 0.05]}>
          <boxGeometry args={[0.68, 0.05, 0.01]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
      </group>
    </Float>
  );
}

function AIEngineNode({ intensity }: { intensity: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringARef.current) {
      ringARef.current.rotation.y += delta * 0.42;
      ringARef.current.rotation.x += delta * 0.22;
    }
    if (ringBRef.current) {
      ringBRef.current.rotation.y -= delta * 0.28;
      ringBRef.current.rotation.z += delta * 0.17;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.06;
      coreRef.current.scale.setScalar(pulse);
      const material = coreRef.current.material as THREE.MeshPhysicalMaterial;
      material.emissiveIntensity = 1.1 + intensity * 0.9;
    }
  });

  return (
    <group position={nodePositions.ai}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.48, 40, 40]} />
        <meshPhysicalMaterial color="#818cf8" emissive="#4338ca" emissiveIntensity={1.25} roughness={0.16} metalness={0.58} clearcoat={0.8} />
      </mesh>
      <mesh ref={ringARef} rotation={[0.4, 0.2, 0]}>
        <torusGeometry args={[0.8, 0.028, 14, 120]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ringBRef} rotation={[1.1, 0.6, 0.4]}>
        <torusGeometry args={[0.95, 0.02, 14, 120]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.46} />
      </mesh>
    </group>
  );
}

function ScoreNode() {
  return (
    <Float speed={1.08} floatIntensity={0.14} rotationIntensity={0.05}>
      <group position={nodePositions.score}>
        <mesh>
          <boxGeometry args={[1.06, 0.76, 0.08]} />
          <meshPhysicalMaterial color="#0ea5e9" emissive="#0c4a6e" emissiveIntensity={0.52} roughness={0.24} metalness={0.54} clearcoat={0.56} />
        </mesh>
        <mesh position={[-0.22, 0.16, 0.045]}>
          <boxGeometry args={[0.18, 0.2, 0.01]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[0, 0.1, 0.045]}>
          <boxGeometry args={[0.18, 0.34, 0.01]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
        <mesh position={[0.22, 0.04, 0.045]}>
          <boxGeometry args={[0.18, 0.46, 0.01]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>
    </Float>
  );
}

function CompanyNode() {
  return (
    <Float speed={0.96} floatIntensity={0.12} rotationIntensity={0.04}>
      <group position={nodePositions.company}>
        <mesh>
          <boxGeometry args={[1.08, 0.78, 0.08]} />
          <meshPhysicalMaterial color="#60a5fa" emissive="#1e3a8a" emissiveIntensity={0.56} roughness={0.22} metalness={0.52} clearcoat={0.6} />
        </mesh>
        <mesh position={[0.24, 0.12, 0.045]}>
          <cylinderGeometry args={[0.13, 0.13, 0.04, 20]} />
          <meshBasicMaterial color="#86efac" />
        </mesh>
        <mesh position={[0.24, 0.12, 0.058]} rotation={[0, 0, -0.38]}>
          <boxGeometry args={[0.1, 0.018, 0.01]} />
          <meshBasicMaterial color="#14532d" />
        </mesh>
        <mesh position={[0.28, 0.08, 0.058]} rotation={[0, 0, 0.72]}>
          <boxGeometry args={[0.06, 0.018, 0.01]} />
          <meshBasicMaterial color="#14532d" />
        </mesh>
      </group>
    </Float>
  );
}

function PipelineNode() {
  return (
    <Float speed={0.92} floatIntensity={0.1} rotationIntensity={0.04}>
      <group position={nodePositions.pipeline}>
        <mesh>
          <boxGeometry args={[1.2, 0.86, 0.09]} />
          <meshPhysicalMaterial color="#38bdf8" emissive="#0e7490" emissiveIntensity={0.46} roughness={0.24} metalness={0.54} clearcoat={0.56} />
        </mesh>
        <mesh position={[-0.25, 0.17, 0.05]}>
          <boxGeometry args={[0.3, 0.08, 0.012]} />
          <meshBasicMaterial color="#dbeafe" />
        </mesh>
        <mesh position={[-0.1, 0.02, 0.05]}>
          <boxGeometry args={[0.6, 0.08, 0.012]} />
          <meshBasicMaterial color="#93c5fd" />
        </mesh>
        <mesh position={[0.14, -0.13, 0.05]}>
          <boxGeometry args={[0.74, 0.08, 0.012]} />
          <meshBasicMaterial color="#2563eb" />
        </mesh>
      </group>
    </Float>
  );
}

function ConnectionPaths({ intensity }: { intensity: number }) {
  return (
    <group>
      {connections.map((pair, index) => (
        <Line key={`flow-${index}`} points={pair} color="#38bdf8" lineWidth={1.25} transparent opacity={0.24 + intensity * 0.16} />
      ))}
    </group>
  );
}

function TravelingSignals({ reducedMotion }: { reducedMotion: boolean }) {
  const signalGroupRef = useRef<THREE.Group>(null);
  const signalData = useMemo(() => {
    return Array.from({ length: 16 }).map((_, index) => ({
      path: connections[index % connections.length],
      progress: (index % 7) / 7
    }));
  }, []);

  useFrame((state, delta) => {
    if (!signalGroupRef.current) return;
    signalGroupRef.current.children.forEach((child, index) => {
      const signal = signalData[index];
      signal.progress += delta * (reducedMotion ? 0.07 : 0.22);
      if (signal.progress > 1) signal.progress = 0;
      child.position.lerpVectors(signal.path[0], signal.path[1], signal.progress);
      child.scale.setScalar(0.78 + Math.sin(state.clock.elapsedTime * 1.55 + index) * 0.16);
    });
  });

  return (
    <group ref={signalGroupRef}>
      {signalData.map((_, index) => (
        <mesh key={`sig-${index}`}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color={index % 2 ? "#67e8f9" : "#93c5fd"} emissive="#22d3ee" emissiveIntensity={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function SceneRig({ reducedMotion, onIntensity, intensity }: { reducedMotion: boolean; onIntensity: (v: number) => void; intensity: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const pointerMag = Math.min(1, Math.hypot(state.pointer.x, state.pointer.y));
    onIntensity(Math.max(0, 1 - pointerMag * 0.75));

    if (groupRef.current) {
      const targetX = state.pointer.x * 0.18;
      const targetY = state.pointer.y * 0.1;
      groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, targetX, 0.04);
      groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, targetY, 0.04);
      if (!reducedMotion) {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.38) * 0.04;
      }
    }

    state.camera.position.x = lerp(state.camera.position.x, state.pointer.x * 0.45, 0.035);
    state.camera.position.y = lerp(state.camera.position.y, state.pointer.y * 0.3, 0.04);
    state.camera.lookAt(0.6, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <ResumeNode />
      <AIEngineNode intensity={intensity} />
      <ScoreNode />
      <CompanyNode />
      <PipelineNode />
      <ConnectionPaths intensity={intensity} />
      <TravelingSignals reducedMotion={reducedMotion} />
    </group>
  );
}

function SceneLights({ focus }: { focus: number }) {
  const mainRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!mainRef.current) return;
    const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 1.3) * 0.12;
    mainRef.current.intensity = 1.3 + focus * 0.95 + pulse;
  });

  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#7dd3fc", "#020617", 0.45]} />
      <pointLight ref={mainRef} position={[0.1, 1.7, 4.1]} color="#818cf8" intensity={1.9} />
      <pointLight position={[-3.2, 1.6, 3.1]} color="#22d3ee" intensity={1.15} />
      <pointLight position={[4.4, -1.5, 2.6]} color="#60a5fa" intensity={1.05} />
    </>
  );
}

export function HeroScene() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [focus, setFocus] = useState(0.58);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0.1, 0, 8.7], fov: 48 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 7, 21]} />
        <SceneLights focus={focus} />
        <SceneRig reducedMotion={reducedMotion} onIntensity={setFocus} intensity={focus} />
      </Canvas>
    </div>
  );
}
