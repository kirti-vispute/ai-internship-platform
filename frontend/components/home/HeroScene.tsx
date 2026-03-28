"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

export type WorkflowModule =
  | "resume-upload"
  | "ai-engine"
  | "resume-score"
  | "skill-gap"
  | "verified-match"
  | "hiring-pipeline";

type HeroSceneProps = {
  activeModule?: WorkflowModule | null;
};

type FlowLink = {
  id: string;
  from: WorkflowModule;
  to: WorkflowModule;
  lift: number;
};

const nodePositions: Record<WorkflowModule, THREE.Vector3> = {
  "resume-upload": new THREE.Vector3(-2.6, 0.46, 0.14),
  "ai-engine": new THREE.Vector3(-0.2, 0.02, 0),
  "resume-score": new THREE.Vector3(2.05, 1.18, 0.12),
  "skill-gap": new THREE.Vector3(2.55, 0.36, 0.1),
  "verified-match": new THREE.Vector3(2.55, -0.48, 0.1),
  "hiring-pipeline": new THREE.Vector3(1.95, -1.28, 0.12)
};

const links: FlowLink[] = [
  { id: "resume-ai", from: "resume-upload", to: "ai-engine", lift: 0.55 },
  { id: "ai-score", from: "ai-engine", to: "resume-score", lift: 0.3 },
  { id: "ai-skill", from: "ai-engine", to: "skill-gap", lift: 0.18 },
  { id: "ai-verified", from: "ai-engine", to: "verified-match", lift: 0.05 },
  { id: "verified-pipeline", from: "verified-match", to: "hiring-pipeline", lift: -0.2 }
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildCurve(start: THREE.Vector3, end: THREE.Vector3, lift: number) {
  const control = start.clone().add(end).multiplyScalar(0.5);
  control.y += lift;
  return new THREE.CatmullRomCurve3([start.clone(), control, end.clone()]);
}

function isNodeActive(id: WorkflowModule, activeModule?: WorkflowModule | null) {
  if (!activeModule) return false;
  if (id === "ai-engine") return true;
  return id === activeModule;
}

function isLinkActive(link: FlowLink, activeModule?: WorkflowModule | null) {
  if (!activeModule) return false;
  if (activeModule === "ai-engine") return true;
  return link.from === activeModule || link.to === activeModule;
}

function ResumeUploadNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = nodePositions["resume-upload"].y + Math.sin(state.clock.elapsedTime * 0.8 + 0.5) * 0.07;
  });

  return (
    <group ref={groupRef} position={nodePositions["resume-upload"].toArray()}>
      <mesh>
        <boxGeometry args={[1.2, 1.05, 0.1]} />
        <meshPhysicalMaterial
          color={active ? "#60a5fa" : "#2563eb"}
          roughness={0.2}
          metalness={0.42}
          clearcoat={0.72}
          emissive="#1e3a8a"
          emissiveIntensity={active ? 1.05 : 0.62}
        />
      </mesh>
      <mesh position={[-0.26, 0.3, 0.058]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="#dbeafe" />
      </mesh>
      <mesh position={[0.12, 0.3, 0.058]}>
        <planeGeometry args={[0.5, 0.04]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0.06, 0.16, 0.058]}>
        <planeGeometry args={[0.7, 0.04]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
      <mesh position={[0.02, 0.01, 0.058]}>
        <planeGeometry args={[0.66, 0.04]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[-0.05, -0.14, 0.058]}>
        <planeGeometry args={[0.55, 0.04]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
    </group>
  );
}

function AIEngineNode({ active }: { active: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.45;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.95) * 0.1;
      coreRef.current.scale.setScalar(pulse);
      const material = coreRef.current.material as THREE.MeshPhysicalMaterial;
      material.emissiveIntensity = (active ? 2 : 1.45) + Math.sin(state.clock.elapsedTime * 2.1) * 0.2;
    }
    if (ringARef.current) ringARef.current.rotation.z += delta * 0.55;
    if (ringBRef.current) ringBRef.current.rotation.x -= delta * 0.35;
  });

  return (
    <group position={nodePositions["ai-engine"].toArray()}>
      <mesh>
        <sphereGeometry args={[1, 34, 34]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0.14} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.6, 40, 40]} />
        <meshPhysicalMaterial
          color={active ? "#a5b4fc" : "#818cf8"}
          roughness={0.08}
          metalness={0.75}
          clearcoat={0.95}
          emissive="#4338ca"
          emissiveIntensity={1.6}
        />
      </mesh>
      <mesh ref={ringARef} rotation={[0.4, 0.2, 0.25]}>
        <torusGeometry args={[0.95, 0.028, 14, 120]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.72} />
      </mesh>
      <mesh ref={ringBRef} rotation={[1, 0.4, 0]}>
        <torusGeometry args={[1.1, 0.02, 14, 120]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function ResumeScoreNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = nodePositions["resume-score"].y + Math.sin(state.clock.elapsedTime * 0.7 + 1.2) * 0.06;
  });

  return (
    <group ref={groupRef} position={nodePositions["resume-score"].toArray()}>
      <mesh>
        <boxGeometry args={[1.08, 0.86, 0.08]} />
        <meshPhysicalMaterial
          color={active ? "#0ea5e9" : "#0369a1"}
          roughness={0.22}
          metalness={0.34}
          clearcoat={0.56}
          emissive="#164e63"
          emissiveIntensity={active ? 0.92 : 0.58}
        />
      </mesh>
      <mesh position={[-0.23, -0.02, 0.052]}>
        <boxGeometry args={[0.15, 0.34, 0.02]} />
        <meshBasicMaterial color="#bae6fd" />
      </mesh>
      <mesh position={[0, 0.06, 0.052]}>
        <boxGeometry args={[0.15, 0.5, 0.02]} />
        <meshBasicMaterial color="#7dd3fc" />
      </mesh>
      <mesh position={[0.23, 0.14, 0.052]}>
        <boxGeometry args={[0.15, 0.66, 0.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

function SkillGapNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = nodePositions["skill-gap"].y + Math.sin(state.clock.elapsedTime * 0.9 + 2) * 0.05;
  });

  return (
    <group ref={groupRef} position={nodePositions["skill-gap"].toArray()}>
      <mesh>
        <boxGeometry args={[1.04, 0.74, 0.08]} />
        <meshPhysicalMaterial
          color={active ? "#0891b2" : "#155e75"}
          roughness={0.2}
          metalness={0.36}
          clearcoat={0.52}
          emissive="#164e63"
          emissiveIntensity={active ? 0.88 : 0.54}
        />
      </mesh>
      <mesh position={[-0.18, 0.1, 0.052]}>
        <boxGeometry args={[0.34, 0.08, 0.02]} />
        <meshBasicMaterial color="#67e8f9" />
      </mesh>
      <mesh position={[0.18, 0.1, 0.052]}>
        <boxGeometry args={[0.24, 0.08, 0.02]} />
        <meshBasicMaterial color="#0ea5e9" />
      </mesh>
      <mesh position={[-0.12, -0.08, 0.052]}>
        <boxGeometry args={[0.22, 0.08, 0.02]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0.18, -0.08, 0.052]}>
        <boxGeometry args={[0.34, 0.08, 0.02]} />
        <meshBasicMaterial color="#14b8a6" />
      </mesh>
    </group>
  );
}

function VerifiedMatchNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = nodePositions["verified-match"].y + Math.sin(state.clock.elapsedTime * 0.76 + 2.5) * 0.05;
  });

  return (
    <group ref={groupRef} position={nodePositions["verified-match"].toArray()}>
      <mesh>
        <boxGeometry args={[1.12, 0.8, 0.08]} />
        <meshPhysicalMaterial
          color={active ? "#2563eb" : "#1e3a8a"}
          roughness={0.24}
          metalness={0.34}
          clearcoat={0.52}
          emissive="#0f172a"
          emissiveIntensity={active ? 0.88 : 0.5}
        />
      </mesh>
      <mesh position={[-0.1, 0.2, 0.052]}>
        <planeGeometry args={[0.54, 0.05]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[-0.14, 0.03, 0.052]}>
        <planeGeometry args={[0.5, 0.05]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
      <mesh position={[-0.2, -0.14, 0.052]}>
        <planeGeometry args={[0.38, 0.05]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0.34, 0.16, 0.054]}>
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
    </group>
  );
}

function HiringPipelineNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = nodePositions["hiring-pipeline"].y + Math.sin(state.clock.elapsedTime * 0.7 + 3) * 0.06;
  });

  return (
    <group ref={groupRef} position={nodePositions["hiring-pipeline"].toArray()}>
      <mesh>
        <boxGeometry args={[1.22, 0.9, 0.08]} />
        <meshPhysicalMaterial
          color={active ? "#0f766e" : "#155e75"}
          roughness={0.2}
          metalness={0.42}
          clearcoat={0.62}
          emissive="#134e4a"
          emissiveIntensity={active ? 0.92 : 0.58}
        />
      </mesh>
      <mesh position={[-0.35, 0.12, 0.052]}>
        <boxGeometry args={[0.2, 0.12, 0.02]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0, 0.12, 0.052]}>
        <boxGeometry args={[0.2, 0.12, 0.02]} />
        <meshBasicMaterial color="#7dd3fc" />
      </mesh>
      <mesh position={[0.35, 0.12, 0.052]}>
        <boxGeometry args={[0.2, 0.12, 0.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[-0.17, 0.12, 0.052]}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
      <mesh position={[0.17, 0.12, 0.052]}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
        <meshBasicMaterial color="#bfdbfe" />
      </mesh>
    </group>
  );
}

function FlowMap({
  reducedMotion,
  activeModule
}: {
  reducedMotion: boolean;
  activeModule?: WorkflowModule | null;
}) {
  const { size } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const lineMaterials = useRef<THREE.Material[]>([]);
  const particleRefs = useRef<THREE.Mesh[]>([]);

  const curves = useMemo(
    () => links.map((link) => buildCurve(nodePositions[link.from], nodePositions[link.to], link.lift)),
    []
  );

  const particleMeta = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        curveIdx: index % curves.length,
        t: (index % 6) / 6
      })),
    [curves.length]
  );

  useFrame((state, delta) => {
    const targetScale = size.width < 640 ? 0.7 : size.width < 1024 ? 0.82 : 0.92;
    const px = state.pointer.x;
    const py = state.pointer.y;
    const proximity = Math.max(0, 1 - Math.min(1, Math.hypot(px * 0.92, py) / 0.74));

    if (groupRef.current) {
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, targetScale, 0.05);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, targetScale, 0.05);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, targetScale, 0.05);
      groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, px * 0.18, 0.045);
      groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, py * 0.1, 0.045);
      groupRef.current.position.y = lerp(
        groupRef.current.position.y,
        reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.4) * 0.07,
        0.04
      );
    }

    state.camera.position.x = lerp(state.camera.position.x, px * 0.35, 0.04);
    state.camera.position.y = lerp(state.camera.position.y, py * 0.2, 0.04);
    state.camera.lookAt(0.45, 0, 0);

    lineMaterials.current.forEach((material, idx) => {
      const lineMaterial = material as THREE.Material & { opacity?: number; color?: THREE.Color };
      const active = isLinkActive(links[idx], activeModule);
      if (typeof lineMaterial.opacity === "number") {
        lineMaterial.opacity = (active ? 0.72 : 0.34) + proximity * 0.18;
      }
      if (lineMaterial.color) {
        lineMaterial.color.set(active ? "#7dd3fc" : "#38bdf8");
      }
    });

    particleRefs.current.forEach((mesh, index) => {
      const meta = particleMeta[index];
      const curve = curves[meta.curveIdx];
      meta.t += delta * (reducedMotion ? 0.06 : 0.22 + meta.curveIdx * 0.025);
      if (meta.t > 1) meta.t = 0;
      mesh.position.copy(curve.getPointAt(meta.t));
      const pulse = 0.86 + Math.sin(state.clock.elapsedTime * 1.8 + index) * 0.18;
      mesh.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={groupRef}>
      <ResumeUploadNode active={isNodeActive("resume-upload", activeModule)} />
      <AIEngineNode active={isNodeActive("ai-engine", activeModule)} />
      <ResumeScoreNode active={isNodeActive("resume-score", activeModule)} />
      <SkillGapNode active={isNodeActive("skill-gap", activeModule)} />
      <VerifiedMatchNode active={isNodeActive("verified-match", activeModule)} />
      <HiringPipelineNode active={isNodeActive("hiring-pipeline", activeModule)} />

      {curves.map((curve, idx) => (
        <Line
          key={links[idx].id}
          points={curve.getPoints(44)}
          color={isLinkActive(links[idx], activeModule) ? "#7dd3fc" : "#38bdf8"}
          lineWidth={1.35}
          transparent
          opacity={0.45}
          ref={(line) => {
            if (!line?.material) return;
            lineMaterials.current[idx] = line.material as THREE.Material;
          }}
        />
      ))}

      {particleMeta.map((_, idx) => (
        <mesh
          key={`particle-${idx}`}
          ref={(mesh) => {
            if (mesh) particleRefs.current[idx] = mesh;
          }}
        >
          <sphereGeometry args={[0.042, 12, 12]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? "#93c5fd" : "#67e8f9"}
            emissive="#22d3ee"
            emissiveIntensity={1.15}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneLights() {
  const pointRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!pointRef.current) return;
    pointRef.current.intensity = 1.9 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
  });

  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#67e8f9", "#020617", 0.5]} />
      <pointLight ref={pointRef} position={[-0.3, 1.6, 4.4]} color="#818cf8" intensity={2} />
      <pointLight position={[-3.6, 0.6, 3.2]} color="#38bdf8" intensity={1.12} />
      <pointLight position={[4.4, -1.4, 3]} color="#22d3ee" intensity={1.05} />
    </>
  );
}

export function HeroScene({ activeModule = null }: HeroSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0.05, 0.02, 8.8], fov: 46 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <fog attach="fog" args={["#020617", 8, 18]} />
        <SceneLights />
        <FlowMap reducedMotion={reducedMotion} activeModule={activeModule} />
      </Canvas>
    </div>
  );
}
