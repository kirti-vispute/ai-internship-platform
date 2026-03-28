"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 280;
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      arr[i3] = (Math.random() - 0.5) * 20;
      arr[i3 + 1] = (Math.random() - 0.5) * 11;
      arr[i3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.07;
    pointsRef.current.rotation.x = lerp(pointsRef.current.rotation.x, state.pointer.y * 0.25, 0.06);
    pointsRef.current.rotation.z = lerp(pointsRef.current.rotation.z, state.pointer.x * 0.2, 0.06);
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial color="#67e8f9" size={0.05} sizeAttenuation transparent opacity={0.88} depthWrite={false} />
    </Points>
  );
}

function ConnectionNetwork() {
  const nodeCount = 16;
  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }).map((_, i) => {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 3.8 + (i % 3) * 0.9;
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * (2.1 + (i % 4) * 0.4), (i % 6) * 0.35 - 1.2);
    });
  }, []);

  const segments = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const next = (i + 1) % nodes.length;
      lines.push([nodes[i], nodes[next]]);
      if (i % 2 === 0) lines.push([nodes[i], nodes[(i + 5) % nodes.length]]);
    }
    return lines;
  }, [nodes]);

  return (
    <group>
      {segments.map((pair, idx) => (
        <Line key={`line-${idx}`} points={pair} color="#38bdf8" lineWidth={0.85} transparent opacity={0.34} />
      ))}
      {nodes.map((n, idx) => (
        <mesh key={`node-${idx}`} position={n}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={idx % 3 === 0 ? "#22d3ee" : "#93c5fd"} emissive="#1e40af" emissiveIntensity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function DomainModules() {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
      groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, state.pointer.y * 0.2, 0.06);
      groupRef.current.position.x = lerp(groupRef.current.position.x, state.pointer.x * 0.9, 0.05);
      groupRef.current.position.y = lerp(groupRef.current.position.y, state.pointer.y * 0.55, 0.05);
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 1.05;
      sphereRef.current.rotation.x += delta * 0.35;
    }
    if (torusRef.current) {
      torusRef.current.rotation.x += delta * 0.65;
      torusRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.38}>
        <mesh ref={sphereRef} position={[-1.4, 0.95, 0.8]}>
          <sphereGeometry args={[0.52, 40, 40]} />
          <meshStandardMaterial color="#22d3ee" emissive="#0ea5e9" emissiveIntensity={1.15} roughness={0.15} metalness={0.6} />
        </mesh>
      </Float>

      <Float speed={1.05} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={torusRef} position={[1.7, -0.35, 0]}>
          <torusGeometry args={[0.95, 0.16, 20, 96]} />
          <meshBasicMaterial color="#93c5fd" wireframe transparent opacity={0.92} />
        </mesh>
      </Float>

      <mesh position={[-3.5, -1.5, -0.5]}>
        <boxGeometry args={[1.4, 0.7, 0.28]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.32} metalness={0.45} roughness={0.28} />
      </mesh>

      <mesh position={[-0.45, 1.9, -0.4]}>
        <boxGeometry args={[1.2, 0.62, 0.25]} />
        <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.28} metalness={0.45} roughness={0.25} />
      </mesh>

      <mesh position={[3.1, 1.55, -0.2]}>
        <boxGeometry args={[1.35, 0.7, 0.3]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.35} metalness={0.48} roughness={0.24} />
      </mesh>

      <mesh position={[2.5, -1.55, 0.55]}>
        <boxGeometry args={[1.5, 0.8, 0.3]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.28} metalness={0.45} roughness={0.22} />
      </mesh>
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    state.camera.position.x = lerp(state.camera.position.x, state.pointer.x * 1.35, 0.06);
    state.camera.position.y = lerp(state.camera.position.y, state.pointer.y * 0.9, 0.06);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function InteractiveHeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 8.5], fov: 54 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#030712"]} />
        <fog attach="fog" args={["#030712", 8, 24]} />

        <ambientLight intensity={0.58} />
        <pointLight position={[4, 6, 6]} color="#22d3ee" intensity={1.7} />
        <pointLight position={[-5, -3, 4]} color="#6366f1" intensity={1.15} />

        <CameraRig />
        <ParticleField />
        <ConnectionNetwork />
        <DomainModules />
      </Canvas>
    </div>
  );
}
