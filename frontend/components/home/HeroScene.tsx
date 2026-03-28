"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

const nodePositions = {
  resume: new THREE.Vector3(-3.1, 0.1, 0.15),
  ai: new THREE.Vector3(-0.1, 0.15, 0),
  skill: new THREE.Vector3(2.8, 1.45, 0.1),
  company: new THREE.Vector3(3.2, 0.05, 0.05),
  pipeline: new THREE.Vector3(2.7, -1.45, 0.12)
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildPath(start: THREE.Vector3, end: THREE.Vector3, lift: number) {
  const control = start.clone().add(end).multiplyScalar(0.5);
  control.y += lift;
  return new THREE.CatmullRomCurve3([start.clone(), control, end.clone()]);
}

function useFloatMotion(ref: { current: THREE.Group | null }, speed: number, amplitude: number, phase = 0) {
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y += (Math.sin(state.clock.elapsedTime * speed + phase) * amplitude - ref.current.position.y) * 0.08;
  });
}

function ResumeNode() {
  const ref = useRef<THREE.Group>(null);
  useFloatMotion(ref, 0.75, 0.08, 0.5);

  return (
    <group ref={ref} position={nodePositions.resume.toArray()}>
      <mesh>
        <boxGeometry args={[1.15, 1.02, 0.09]} />
        <meshPhysicalMaterial color="#1d4ed8" roughness={0.24} metalness={0.4} clearcoat={0.65} emissive="#0f172a" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-0.25, 0.27, 0.055]}>
        <planeGeometry args={[0.23, 0.23]} />
        <meshBasicMaterial color="#dbeafe" />
      </mesh>
      <mesh position={[0.12, 0.29, 0.055]}>
        <planeGeometry args={[0.46, 0.04]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0.03, 0.14, 0.055]}>
        <planeGeometry args={[0.72, 0.04]} />
        <meshBasicMaterial color="#cbd5e1" />
      </mesh>
      <mesh position={[0.03, 0, 0.055]}>
        <planeGeometry args={[0.72, 0.04]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[-0.04, -0.14, 0.055]}>
        <planeGeometry args={[0.58, 0.04]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
    </group>
  );
}

function AIEngineNode() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.42;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.75) * 0.09;
      coreRef.current.scale.setScalar(pulse);
      const material = coreRef.current.material as THREE.MeshPhysicalMaterial;
      material.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 2.1) * 0.2;
    }
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.55;
    if (haloRef.current) {
      haloRef.current.rotation.z -= delta * 0.2;
      haloRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.3) * 0.04);
    }
  });

  return (
    <group position={nodePositions.ai.toArray()}>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0.14} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.58, 36, 36]} />
        <meshPhysicalMaterial color="#818cf8" roughness={0.08} metalness={0.72} clearcoat={0.9} emissive="#4f46e5" emissiveIntensity={1.5} />
      </mesh>
      <mesh ref={ringRef} rotation={[0.45, 0.2, 0.2]}>
        <torusGeometry args={[0.95, 0.03, 14, 120]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function SkillScoreNode() {
  const ref = useRef<THREE.Group>(null);
  useFloatMotion(ref, 0.65, 0.07, 1.2);

  return (
    <group ref={ref} position={nodePositions.skill.toArray()}>
      <mesh>
        <boxGeometry args={[1.12, 0.92, 0.08]} />
        <meshPhysicalMaterial color="#0369a1" roughness={0.24} metalness={0.35} clearcoat={0.5} emissive="#164e63" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[-0.26, -0.04, 0.05]}>
        <boxGeometry args={[0.16, 0.36, 0.02]} />
        <meshBasicMaterial color="#bae6fd" />
      </mesh>
      <mesh position={[0, 0.06, 0.05]}>
        <boxGeometry args={[0.16, 0.56, 0.02]} />
        <meshBasicMaterial color="#7dd3fc" />
      </mesh>
      <mesh position={[0.26, 0.16, 0.05]}>
        <boxGeometry args={[0.16, 0.74, 0.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

function CompanyNode() {
  const ref = useRef<THREE.Group>(null);
  useFloatMotion(ref, 0.58, 0.06, 1.8);

  return (
    <group ref={ref} position={nodePositions.company.toArray()}>
      <mesh>
        <boxGeometry args={[1.2, 0.95, 0.08]} />
        <meshPhysicalMaterial color="#1e3a8a" roughness={0.27} metalness={0.36} clearcoat={0.5} emissive="#0f172a" emissiveIntensity={0.48} />
      </mesh>
      <mesh position={[-0.15, 0.25, 0.05]}>
        <planeGeometry args={[0.58, 0.05]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[-0.15, 0.08, 0.05]}>
        <planeGeometry args={[0.58, 0.05]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
      <mesh position={[-0.2, -0.1, 0.05]}>
        <planeGeometry args={[0.48, 0.05]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0.35, 0.2, 0.055]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
      <mesh position={[0.35, 0.2, 0.065]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.07, 0.02, 0.01]} />
        <meshBasicMaterial color="#052e16" />
      </mesh>
      <mesh position={[0.39, 0.16, 0.065]} rotation={[0, 0, 0.75]}>
        <boxGeometry args={[0.12, 0.02, 0.01]} />
        <meshBasicMaterial color="#052e16" />
      </mesh>
    </group>
  );
}

function PipelineNode() {
  const ref = useRef<THREE.Group>(null);
  useFloatMotion(ref, 0.72, 0.06, 2.4);

  return (
    <group ref={ref} position={nodePositions.pipeline.toArray()}>
      <mesh>
        <boxGeometry args={[1.26, 0.96, 0.08]} />
        <meshPhysicalMaterial color="#155e75" roughness={0.2} metalness={0.42} clearcoat={0.62} emissive="#0f172a" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.34, 0.14, 0.05]}>
        <boxGeometry args={[0.22, 0.14, 0.02]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0, 0.14, 0.05]}>
        <boxGeometry args={[0.22, 0.14, 0.02]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0.34, 0.14, 0.05]}>
        <boxGeometry args={[0.22, 0.14, 0.02]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[-0.17, 0.14, 0.05]}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
      <mesh position={[0.17, 0.14, 0.05]}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
    </group>
  );
}

function FlowNetwork({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const lineMaterials = useRef<THREE.Material[]>([]);
  const particleRefs = useRef<THREE.Mesh[]>([]);

  const curves = useMemo(
    () => [
      buildPath(nodePositions.resume, nodePositions.ai, 0.62),
      buildPath(nodePositions.ai, nodePositions.skill, 0.35),
      buildPath(nodePositions.ai, nodePositions.company, 0.06),
      buildPath(nodePositions.ai, nodePositions.pipeline, -0.4)
    ],
    []
  );

  const particleState = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, index) => ({
        curveIndex: index % curves.length,
        t: (index % 4) / 4
      })),
    [curves.length]
  );

  useFrame((state, delta) => {
    const pointerX = state.pointer.x;
    const pointerY = state.pointer.y;
    const proximity = Math.max(0, 1 - Math.min(1, Math.hypot(pointerX * 0.9, pointerY) / 0.7));

    if (groupRef.current) {
      groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, pointerX * 0.2, 0.05);
      groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, pointerY * 0.11, 0.05);
      groupRef.current.position.y = lerp(groupRef.current.position.y, reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.42) * 0.08, 0.04);
    }

    state.camera.position.x = lerp(state.camera.position.x, pointerX * 0.45, 0.04);
    state.camera.position.y = lerp(state.camera.position.y, pointerY * 0.28, 0.04);
    state.camera.lookAt(0.9, 0.05, 0);

    lineMaterials.current.forEach((material) => {
      const lineMaterial = material as THREE.Material & { opacity?: number };
      if (typeof lineMaterial.opacity === "number") {
        lineMaterial.opacity = 0.32 + proximity * 0.36;
      }
    });

    particleRefs.current.forEach((mesh, index) => {
      const info = particleState[index];
      const curve = curves[info.curveIndex];
      info.t += delta * (reducedMotion ? 0.07 : 0.24 + info.curveIndex * 0.02);
      if (info.t > 1) info.t = 0;
      mesh.position.copy(curve.getPointAt(info.t));
      const scalePulse = 0.85 + Math.sin(state.clock.elapsedTime * 1.8 + index) * 0.16;
      mesh.scale.setScalar(scalePulse);
    });
  });

  return (
    <group ref={groupRef}>
      <ResumeNode />
      <AIEngineNode />
      <SkillScoreNode />
      <CompanyNode />
      <PipelineNode />

      {curves.map((curve, index) => (
        <Line
          key={`flow-line-${index}`}
          points={curve.getPoints(44)}
          color={index === 0 ? "#60a5fa" : "#67e8f9"}
          lineWidth={1.4}
          transparent
          opacity={0.56}
          ref={(line) => {
            if (!line?.material) return;
            lineMaterials.current[index] = line.material as THREE.Material;
          }}
        />
      ))}

      {particleState.map((_, index) => (
        <mesh
          key={`flow-particle-${index}`}
          ref={(mesh) => {
            if (mesh) particleRefs.current[index] = mesh;
          }}
        >
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color={index % 2 === 0 ? "#93c5fd" : "#67e8f9"} emissive="#22d3ee" emissiveIntensity={1.1} />
        </mesh>
      ))}
    </group>
  );
}

function SceneLights() {
  const keyRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!keyRef.current) return;
    keyRef.current.intensity = 1.9 + Math.sin(state.clock.elapsedTime * 1.4) * 0.22;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#67e8f9", "#020617", 0.45]} />
      <pointLight ref={keyRef} position={[0.1, 1.8, 4.5]} color="#6366f1" intensity={2} />
      <pointLight position={[-3.4, 0.8, 3.2]} color="#38bdf8" intensity={1.15} />
      <pointLight position={[4.2, -1.6, 3]} color="#22d3ee" intensity={1.05} />
    </>
  );
}

export function HeroScene() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0.2, 0.1, 8.5], fov: 44 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 7, 18]} />
        <SceneLights />
        <FlowNetwork reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
