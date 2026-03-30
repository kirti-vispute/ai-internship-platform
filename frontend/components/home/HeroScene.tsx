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

const nodeAnchors: Record<WorkflowModule, { x: number; y: number; z: number }> = {
  "resume-upload": { x: -0.68, y: 0.38, z: 0.14 },
  "ai-engine": { x: 0, y: 0.02, z: 0 },
  "resume-score": { x: 0.58, y: 0.5, z: 0.12 },
  "skill-gap": { x: 0.72, y: 0.12, z: 0.1 },
  "verified-match": { x: 0.72, y: -0.26, z: 0.1 },
  "hiring-pipeline": { x: 0.58, y: -0.6, z: 0.12 }
};

const links: FlowLink[] = [
  { id: "resume-ai", from: "resume-upload", to: "ai-engine", lift: 0.52 },
  { id: "ai-score", from: "ai-engine", to: "resume-score", lift: 0.3 },
  { id: "ai-skill", from: "ai-engine", to: "skill-gap", lift: 0.14 },
  { id: "ai-verified", from: "ai-engine", to: "verified-match", lift: 0.05 },
  { id: "verified-pipeline", from: "verified-match", to: "hiring-pipeline", lift: -0.16 }
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

function ResumeUploadNode({ active, position }: { active: boolean; position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 0.8 + 0.5) * 0.07;
  });

  return (
    <group ref={groupRef} position={position.toArray()}>
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

function AIEngineNode({ active, position }: { active: boolean; position: THREE.Vector3 }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const pulseA = 1 + Math.sin(state.clock.elapsedTime * 1.95) * 0.1;
    const pulseB = 1 + Math.sin(state.clock.elapsedTime * 1.2 + 0.6) * 0.08;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.45;
      coreRef.current.scale.setScalar(pulseA);
      const material = coreRef.current.material as THREE.MeshPhysicalMaterial;
      material.emissiveIntensity = (active ? 2 : 1.45) + Math.sin(state.clock.elapsedTime * 2.1) * 0.2;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulseA * 1.02);
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = active ? 0.2 : 0.14;
    }
    if (outerGlowRef.current) {
      outerGlowRef.current.scale.setScalar(pulseB * 1.04);
      const material = outerGlowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = active ? 0.12 : 0.08;
    }
    if (ringARef.current) ringARef.current.rotation.z += delta * 0.55;
    if (ringBRef.current) ringBRef.current.rotation.x -= delta * 0.35;
  });

  return (
    <group position={position.toArray()}>
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[1.58, 34, 34]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.08} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.16, 34, 34]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.14} />
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

function ResumeScoreNode({ active, position }: { active: boolean; position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 0.7 + 1.2) * 0.06;
  });

  return (
    <group ref={groupRef} position={position.toArray()}>
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

function SkillGapNode({ active, position }: { active: boolean; position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 0.9 + 2) * 0.05;
  });

  return (
    <group ref={groupRef} position={position.toArray()}>
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

function VerifiedMatchNode({ active, position }: { active: boolean; position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 0.76 + 2.5) * 0.05;
  });

  return (
    <group ref={groupRef} position={position.toArray()}>
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

function HiringPipelineNode({ active, position }: { active: boolean; position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 0.7 + 3) * 0.06;
  });

  return (
    <group ref={groupRef} position={position.toArray()}>
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

function DepthParallaxLayer() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.x = lerp(groupRef.current.position.x, state.pointer.x * 0.28, 0.03);
    groupRef.current.position.y = lerp(groupRef.current.position.y, state.pointer.y * 0.18, 0.03);
    groupRef.current.rotation.z = lerp(groupRef.current.rotation.z, state.pointer.x * 0.05, 0.02);
  });

  return (
    <group ref={groupRef} position={[0, 0, -2.8]}>
      <mesh position={[-1.2, 1, -0.1]}>
        <sphereGeometry args={[1.15, 24, 24]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.07} />
      </mesh>
      <mesh position={[2.2, -0.6, -0.2]}>
        <sphereGeometry args={[0.95, 24, 24]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.06} />
      </mesh>
      <mesh position={[0.5, 0.1, -0.35]}>
        <sphereGeometry args={[1.35, 24, 24]} />
        <meshBasicMaterial color="#4338ca" transparent opacity={0.05} />
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

  const layoutPositions = useMemo(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const xSpan = THREE.MathUtils.clamp(3.15 + (aspect - 1.2) * 0.45, 2.75, 3.65);
    const ySpan = THREE.MathUtils.clamp(2 + (1.2 - Math.min(aspect, 1.2)) * 0.2, 1.8, 2.15);

    return Object.fromEntries(
      (Object.keys(nodeAnchors) as WorkflowModule[]).map((id) => {
        const anchor = nodeAnchors[id];
        return [id, new THREE.Vector3(anchor.x * xSpan, anchor.y * ySpan, anchor.z)];
      })
    ) as Record<WorkflowModule, THREE.Vector3>;
  }, [size.width, size.height]);

  const curves = useMemo(
    () => links.map((link) => buildCurve(layoutPositions[link.from], layoutPositions[link.to], link.lift)),
    [layoutPositions]
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
    const targetScale = size.width < 640 ? 0.74 : size.width < 1024 ? 0.86 : 0.96;
    const px = state.pointer.x;
    const py = state.pointer.y;
    const proximity = Math.max(0, 1 - Math.min(1, Math.hypot(px * 0.88, py) / 0.78));

    if (groupRef.current) {
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, targetScale, 0.05);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, targetScale, 0.05);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, targetScale, 0.05);
      groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, px * 0.14, 0.04);
      groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, py * 0.08, 0.04);
      groupRef.current.position.x = lerp(groupRef.current.position.x, 0.08, 0.04);
      groupRef.current.position.y = lerp(
        groupRef.current.position.y,
        reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.42) * 0.07,
        0.04
      );
    }

    state.camera.position.x = lerp(state.camera.position.x, px * 0.24, 0.04);
    state.camera.position.y = lerp(state.camera.position.y, py * 0.14, 0.04);
    state.camera.lookAt(0.22, -0.02, 0);

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
      <ResumeUploadNode active={isNodeActive("resume-upload", activeModule)} position={layoutPositions["resume-upload"]} />
      <AIEngineNode active={isNodeActive("ai-engine", activeModule)} position={layoutPositions["ai-engine"]} />
      <ResumeScoreNode active={isNodeActive("resume-score", activeModule)} position={layoutPositions["resume-score"]} />
      <SkillGapNode active={isNodeActive("skill-gap", activeModule)} position={layoutPositions["skill-gap"]} />
      <VerifiedMatchNode active={isNodeActive("verified-match", activeModule)} position={layoutPositions["verified-match"]} />
      <HiringPipelineNode active={isNodeActive("hiring-pipeline", activeModule)} position={layoutPositions["hiring-pipeline"]} />

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
          <meshStandardMaterial color={idx % 2 === 0 ? "#93c5fd" : "#67e8f9"} emissive="#22d3ee" emissiveIntensity={1.15} />
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
      <Canvas camera={{ position: [0.05, 0.02, 8.95], fov: 46 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <fog attach="fog" args={["#020617", 8, 18]} />
        <SceneLights />
        <DepthParallaxLayer />
        <FlowMap reducedMotion={reducedMotion} activeModule={activeModule} />
      </Canvas>
    </div>
  );
}
