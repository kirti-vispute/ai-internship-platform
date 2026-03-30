"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
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

type ConnectorAnchor = {
  xPct: number;
  yPct: number;
};

type CursorBias = {
  x: number;
  y: number;
  proximity: number;
};

type HeroSceneProps = {
  activeModule?: WorkflowModule | null;
  connectorAnchors?: Partial<Record<WorkflowModule, ConnectorAnchor>>;
  cursorBiasRef?: MutableRefObject<CursorBias>;
};

type FlowLink = {
  id: string;
  from: WorkflowModule;
  to: WorkflowModule;
  lift: number;
};

const defaultAnchors: Record<WorkflowModule, ConnectorAnchor & { z: number }> = {
  "resume-upload": { xPct: 0.3, yPct: 0.19, z: 0.1 },
  "ai-engine": { xPct: 0.5, yPct: 0.5, z: 0 },
  "resume-score": { xPct: 0.68, yPct: 0.2, z: 0.1 },
  "skill-gap": { xPct: 0.68, yPct: 0.36, z: 0.1 },
  "verified-match": { xPct: 0.68, yPct: 0.52, z: 0.1 },
  "hiring-pipeline": { xPct: 0.68, yPct: 0.68, z: 0.1 }
};

const links: FlowLink[] = [
  { id: "ai-resume", from: "ai-engine", to: "resume-upload", lift: 0.2 },
  { id: "ai-score", from: "ai-engine", to: "resume-score", lift: 0.15 },
  { id: "ai-skill", from: "ai-engine", to: "skill-gap", lift: 0.04 },
  { id: "ai-verified", from: "ai-engine", to: "verified-match", lift: -0.06 },
  { id: "ai-pipeline", from: "ai-engine", to: "hiring-pipeline", lift: -0.18 }
];

const nodeEdgeRadius: Record<WorkflowModule, number> = {
  "resume-upload": 0,
  "ai-engine": 0.72,
  "resume-score": 0,
  "skill-gap": 0,
  "verified-match": 0,
  "hiring-pipeline": 0
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildCurveEdgeToEdge(from: WorkflowModule, to: WorkflowModule, positions: Record<WorkflowModule, THREE.Vector3>, lift: number) {
  const start = positions[from].clone();
  const end = positions[to].clone();
  const dir = end.clone().sub(start).normalize();
  const edgeStart = start.add(dir.clone().multiplyScalar(nodeEdgeRadius[from]));
  const edgeEnd = end.sub(dir.clone().multiplyScalar(nodeEdgeRadius[to]));
  const control = edgeStart.clone().add(edgeEnd).multiplyScalar(0.5);
  control.y += lift;
  return new THREE.CatmullRomCurve3([edgeStart, control, edgeEnd]);
}

function isLinkActive(link: FlowLink, activeModule?: WorkflowModule | null) {
  if (!activeModule) return false;
  if (activeModule === "ai-engine") return true;
  return link.from === activeModule || link.to === activeModule;
}

function AIEngineNode({
  active,
  position,
  cursorBiasRef
}: {
  active: boolean;
  position: THREE.Vector3;
  cursorBiasRef?: MutableRefObject<CursorBias>;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const cursorProximity = cursorBiasRef?.current.proximity ?? Math.max(0, 1 - Math.min(1, Math.hypot(state.pointer.x, state.pointer.y)));
    const pulseA = 1 + Math.sin(state.clock.elapsedTime * 1.95) * 0.12;
    const pulseB = 1 + Math.sin(state.clock.elapsedTime * 1.2 + 0.6) * 0.08;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.45;
      coreRef.current.scale.setScalar(pulseA + cursorProximity * 0.04);
      const material = coreRef.current.material as THREE.MeshPhysicalMaterial;
      material.emissiveIntensity = (active ? 2.1 : 1.55) + cursorProximity * 0.55 + Math.sin(state.clock.elapsedTime * 2.1) * 0.2;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulseA * (1.02 + cursorProximity * 0.05));
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (active ? 0.22 : 0.16) + cursorProximity * 0.08;
    }
    if (outerGlowRef.current) {
      outerGlowRef.current.scale.setScalar(pulseB * (1.04 + cursorProximity * 0.05));
      const material = outerGlowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (active ? 0.12 : 0.08) + cursorProximity * 0.05;
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

function FlowMap({
  reducedMotion,
  activeModule,
  connectorAnchors,
  cursorBiasRef
}: {
  reducedMotion: boolean;
  activeModule?: WorkflowModule | null;
  connectorAnchors?: Partial<Record<WorkflowModule, ConnectorAnchor>>;
  cursorBiasRef?: MutableRefObject<CursorBias>;
}) {
  const { size, viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const lineMaterials = useRef<THREE.Material[]>([]);
  const particleRefs = useRef<THREE.Mesh[]>([]);

  const anchors = useMemo(() => {
    const merged: Record<WorkflowModule, ConnectorAnchor & { z: number }> = { ...defaultAnchors };

    (Object.keys(connectorAnchors ?? {}) as WorkflowModule[]).forEach((id) => {
      const value = connectorAnchors?.[id];
      if (!value || id === "ai-engine") return;
      merged[id] = {
        xPct: Math.min(0.995, Math.max(0.005, value.xPct)),
        yPct: Math.min(0.995, Math.max(0.005, value.yPct)),
        z: defaultAnchors[id].z
      };
    });

    return merged;
  }, [connectorAnchors]);

  const layoutPositions = useMemo(() => {
    const usableW = viewport.width * 0.86;
    const usableH = viewport.height * 0.84;

    return Object.fromEntries(
      (Object.keys(anchors) as WorkflowModule[]).map((id) => {
        const anchor = anchors[id];
        const x = (anchor.xPct - 0.5) * usableW;
        const y = (0.5 - anchor.yPct) * usableH;
        return [id, new THREE.Vector3(x, y, anchor.z)];
      })
    ) as Record<WorkflowModule, THREE.Vector3>;
  }, [anchors, viewport.width, viewport.height]);

  const curves = useMemo(
    () => links.map((link) => buildCurveEdgeToEdge(link.from, link.to, layoutPositions, link.lift)),
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
    const externalBias = cursorBiasRef?.current;
    const biasX = externalBias ? externalBias.x : state.pointer.x;
    const biasY = externalBias ? externalBias.y : state.pointer.y;
    const biasProximity = externalBias
      ? externalBias.proximity
      : Math.max(0, 1 - Math.min(1, Math.hypot(state.pointer.x, state.pointer.y)));

    const targetScale = size.width < 640 ? 0.92 : size.width < 1024 ? 0.98 : 1.02;

    if (groupRef.current) {
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, targetScale, 0.05);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, targetScale, 0.05);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, targetScale, 0.05);
      groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, biasX * 0.16, 0.04);
      groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, biasY * 0.1, 0.04);
      groupRef.current.position.x = lerp(groupRef.current.position.x, biasX * 0.26, 0.045);
      groupRef.current.position.y = lerp(groupRef.current.position.y, biasY * 0.16, 0.045);
    }

    state.camera.position.x = lerp(state.camera.position.x, biasX * 0.28, 0.045);
    state.camera.position.y = lerp(state.camera.position.y, biasY * 0.18, 0.045);
    state.camera.lookAt(0, 0, 0);

    lineMaterials.current.forEach((material, idx) => {
      const lineMaterial = material as THREE.Material & { opacity?: number; color?: THREE.Color };
      const active = isLinkActive(links[idx], activeModule);
      if (typeof lineMaterial.opacity === "number") {
        lineMaterial.opacity = (active ? 0.74 : 0.35) + biasProximity * 0.2;
      }
      if (lineMaterial.color) {
        lineMaterial.color.set(active ? "#7dd3fc" : "#38bdf8");
      }
    });

    particleRefs.current.forEach((mesh, index) => {
      const meta = particleMeta[index];
      const curve = curves[meta.curveIdx];
      meta.t += delta * (reducedMotion ? 0.06 : 0.22 + meta.curveIdx * 0.03);
      if (meta.t > 1) meta.t = 0;

      const point = curve.getPointAt(meta.t);
      const driftFactor = 0.06 + (meta.curveIdx % 3) * 0.025;
      const targetX = point.x + biasX * driftFactor;
      const targetY = point.y + biasY * driftFactor * 0.7;

      mesh.position.x = lerp(mesh.position.x, targetX, 0.18);
      mesh.position.y = lerp(mesh.position.y, targetY, 0.18);
      mesh.position.z = lerp(mesh.position.z, point.z, 0.18);

      const pulse = 0.86 + Math.sin(state.clock.elapsedTime * 1.8 + index) * 0.18;
      mesh.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={groupRef}>
      <AIEngineNode active={activeModule === "ai-engine" || !activeModule} position={layoutPositions["ai-engine"]} cursorBiasRef={cursorBiasRef} />

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

export function HeroScene({ activeModule = null, connectorAnchors, cursorBiasRef }: HeroSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div className="absolute inset-0 z-0 h-full w-full">
      <Canvas className="h-full w-full" camera={{ position: [0.05, 0.02, 8.95], fov: 46 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <fog attach="fog" args={["#020617", 8, 18]} />
        <SceneLights />
        <FlowMap reducedMotion={reducedMotion} activeModule={activeModule} connectorAnchors={connectorAnchors} cursorBiasRef={cursorBiasRef} />
      </Canvas>
    </div>
  );
}


