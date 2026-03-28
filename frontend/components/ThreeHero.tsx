"use client";

import { useEffect, useRef } from "react";

export function ThreeHero() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const THREE = await import("three");
      if (cancelled) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.set(0, 0, 20);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      mountEl.appendChild(renderer.domElement);

      const core = new THREE.Group();
      scene.add(core);

      const moduleGroup = new THREE.Group();
      core.add(moduleGroup);

      const networkGroup = new THREE.Group();
      networkGroup.position.set(0, 0, -1.8);
      core.add(networkGroup);

      const internNode = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 20, 20),
        new THREE.MeshBasicMaterial({ color: "#22d3ee" })
      );
      internNode.position.set(-6.8, -1.2, 0.9);
      core.add(internNode);

      const aiNode = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 24, 24),
        new THREE.MeshBasicMaterial({ color: "#3b82f6" })
      );
      aiNode.position.set(-0.2, 0.2, 0);
      core.add(aiNode);

      const companyNode = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 20, 20),
        new THREE.MeshBasicMaterial({ color: "#a5b4fc" })
      );
      companyNode.position.set(6.4, 1.4, -0.2);
      core.add(companyNode);

      const makeModule = (color: string, position: [number, number, number], scale = 1) => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.6 * scale, 0.9 * scale, 0.42 * scale),
          new THREE.MeshPhongMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.18,
            transparent: true,
            opacity: 0.85
          })
        );
        mesh.position.set(...position);
        moduleGroup.add(mesh);
        return mesh;
      };

      const resumeModule = makeModule("#0ea5e9", [-4.9, -0.2, 1.2]);
      const skillModule = makeModule("#38bdf8", [-1.5, 1.8, 0.6]);
      const verifiedModule = makeModule("#6366f1", [4.6, 2.6, -0.2]);
      const pipelineModule = makeModule("#22d3ee", [3.4, -1.6, 0.4], 1.1);

      const ambient = new THREE.AmbientLight("#60a5fa", 0.35);
      scene.add(ambient);
      const keyLight = new THREE.PointLight("#22d3ee", 1.6, 45, 1.5);
      keyLight.position.set(-2, 4, 8);
      scene.add(keyLight);

      const pulseOrb = new THREE.Mesh(
        new THREE.SphereGeometry(4.1, 30, 30),
        new THREE.MeshBasicMaterial({ color: "#0ea5e9", transparent: true, opacity: 0.14 })
      );
      pulseOrb.position.copy(aiNode.position);
      core.add(pulseOrb);

      const networkNodeCount = 72;
      const networkPositions = new Float32Array(networkNodeCount * 3);
      const networkVelocities = new Float32Array(networkNodeCount * 3);
      for (let i = 0; i < networkNodeCount; i += 1) {
        const i3 = i * 3;
        networkPositions[i3] = (Math.random() - 0.5) * 22;
        networkPositions[i3 + 1] = (Math.random() - 0.5) * 13;
        networkPositions[i3 + 2] = (Math.random() - 0.5) * 4;
        networkVelocities[i3] = (Math.random() - 0.5) * 0.015;
        networkVelocities[i3 + 1] = (Math.random() - 0.5) * 0.015;
        networkVelocities[i3 + 2] = (Math.random() - 0.5) * 0.005;
      }

      const networkGeometry = new THREE.BufferGeometry();
      const networkPositionAttr = new THREE.BufferAttribute(networkPositions, 3);
      networkGeometry.setAttribute("position", networkPositionAttr);
      const networkPoints = new THREE.Points(
        networkGeometry,
        new THREE.PointsMaterial({
          color: "#67e8f9",
          size: 0.08,
          transparent: true,
          opacity: 0.9
        })
      );
      networkGroup.add(networkPoints);

      const maxNetworkSegments = networkNodeCount * 6;
      const networkLinePositions = new Float32Array(maxNetworkSegments * 2 * 3);
      const networkLineGeometry = new THREE.BufferGeometry();
      const networkLineAttr = new THREE.BufferAttribute(networkLinePositions, 3);
      networkLineGeometry.setAttribute("position", networkLineAttr);
      networkLineGeometry.setDrawRange(0, 0);
      const networkLines = new THREE.LineSegments(
        networkLineGeometry,
        new THREE.LineBasicMaterial({
          color: "#38bdf8",
          transparent: true,
          opacity: 0.2
        })
      );
      networkGroup.add(networkLines);

      const curveA = new THREE.CatmullRomCurve3([
        internNode.position.clone(),
        new THREE.Vector3(-4.3, -0.6, 1.7),
        new THREE.Vector3(-2.1, 0.4, 0.8),
        aiNode.position.clone(),
        new THREE.Vector3(2.3, 1.2, 0.4),
        new THREE.Vector3(4.1, 1.7, -0.3),
        companyNode.position.clone()
      ]);

      const curveB = new THREE.CatmullRomCurve3([
        resumeModule.position.clone(),
        new THREE.Vector3(-3.6, 1.6, -0.8),
        skillModule.position.clone(),
        aiNode.position.clone().add(new THREE.Vector3(0.4, 1.4, 0.1)),
        verifiedModule.position.clone(),
        new THREE.Vector3(4.4, 0.4, 0.1),
        pipelineModule.position.clone()
      ]);

      const pathGeoA = new THREE.BufferGeometry().setFromPoints(curveA.getPoints(200));
      const pathGeoB = new THREE.BufferGeometry().setFromPoints(curveB.getPoints(220));

      const pathMatA = new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.35 });
      const pathMatB = new THREE.LineBasicMaterial({ color: "#60a5fa", transparent: true, opacity: 0.26 });

      const pathLineA = new THREE.Line(pathGeoA, pathMatA);
      const pathLineB = new THREE.Line(pathGeoB, pathMatB);
      core.add(pathLineA);
      core.add(pathLineB);

      const bgParticleCount = 120;
      const bgPositions = new Float32Array(bgParticleCount * 3);
      for (let i = 0; i < bgParticleCount; i += 1) {
        const i3 = i * 3;
        bgPositions[i3] = (Math.random() - 0.5) * 28;
        bgPositions[i3 + 1] = (Math.random() - 0.5) * 18;
        bgPositions[i3 + 2] = (Math.random() - 0.5) * 8;
      }

      const bgParticleGeometry = new THREE.BufferGeometry();
      bgParticleGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
      const bgParticles = new THREE.Points(
        bgParticleGeometry,
        new THREE.PointsMaterial({ color: "#38bdf8", size: 0.06, transparent: true, opacity: 0.62 })
      );
      core.add(bgParticles);

      const createFlowParticle = (color: string, size = 0.11) => {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 14, 14),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
        );
        core.add(mesh);
        return mesh;
      };

      const flowParticles = [
        { mesh: createFlowParticle("#22d3ee"), offset: 0, speed: 0.0019, curve: curveA },
        { mesh: createFlowParticle("#60a5fa"), offset: 0.26, speed: 0.0015, curve: curveA },
        { mesh: createFlowParticle("#93c5fd", 0.1), offset: 0.11, speed: 0.0018, curve: curveB },
        { mesh: createFlowParticle("#38bdf8", 0.1), offset: 0.54, speed: 0.0014, curve: curveB }
      ];

      const mouse = new THREE.Vector2(0, 0);
      const targetMouse = new THREE.Vector2(0, 0);
      let scrollProgress = 0;

      const onPointerMove = (event: PointerEvent) => {
        const rect = mountEl.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        targetMouse.set(x, y);
      };

      const onScroll = () => {
        const y = window.scrollY || 0;
        scrollProgress = Math.min(1, y / 800);
      };

      const onResize = () => {
        const { clientWidth, clientHeight } = mountEl;
        if (!clientWidth || !clientHeight) return;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight, false);
      };

      onResize();
      onScroll();
      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });

      let rafId = 0;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;

        mouse.lerp(targetMouse, 0.045);
        core.rotation.y = mouse.x * 0.13;
        core.rotation.x = mouse.y * 0.055 + scrollProgress * 0.07;
        core.position.x = mouse.x * 0.9;
        core.position.y = mouse.y * 0.58 - scrollProgress * 0.85;

        const proximity = 1 - Math.min(1, Math.hypot(mouse.x, mouse.y));
        pathMatA.opacity = 0.28 + proximity * 0.34;
        pathMatB.opacity = 0.18 + proximity * 0.28;
        keyLight.intensity = 1.25 + proximity * 0.75;

        aiNode.scale.setScalar(1 + Math.sin(elapsed * 0.004) * 0.04 + proximity * 0.05);
        pulseOrb.scale.setScalar(1 + Math.sin(elapsed * 0.0026) * 0.05 + proximity * 0.03);
        moduleGroup.rotation.y = Math.sin(elapsed * 0.00055) * 0.06 + mouse.x * 0.05;
        moduleGroup.rotation.x = Math.cos(elapsed * 0.00042) * 0.03 + mouse.y * 0.03;

        resumeModule.position.y = -0.2 + Math.sin(elapsed * 0.0012) * 0.08;
        skillModule.position.y = 1.8 + Math.sin(elapsed * 0.001 + 0.8) * 0.08;
        verifiedModule.position.y = 2.6 + Math.sin(elapsed * 0.0011 + 1.2) * 0.07;
        pipelineModule.position.y = -1.6 + Math.sin(elapsed * 0.00125 + 1.7) * 0.07;

        bgParticles.rotation.z += 0.00033;

        const pullX = mouse.x * 0.0018;
        const pullY = mouse.y * 0.0015;
        for (let i = 0; i < networkNodeCount; i += 1) {
          const i3 = i * 3;
          networkVelocities[i3] += pullX;
          networkVelocities[i3 + 1] += pullY;

          networkPositions[i3] += networkVelocities[i3];
          networkPositions[i3 + 1] += networkVelocities[i3 + 1];
          networkPositions[i3 + 2] += networkVelocities[i3 + 2];

          networkVelocities[i3] *= 0.985;
          networkVelocities[i3 + 1] *= 0.985;
          networkVelocities[i3 + 2] *= 0.985;

          if (networkPositions[i3] > 11 || networkPositions[i3] < -11) networkVelocities[i3] *= -1;
          if (networkPositions[i3 + 1] > 7 || networkPositions[i3 + 1] < -7) networkVelocities[i3 + 1] *= -1;
          if (networkPositions[i3 + 2] > 2.5 || networkPositions[i3 + 2] < -2.5) networkVelocities[i3 + 2] *= -1;
        }
        networkPositionAttr.needsUpdate = true;

        let segmentCursor = 0;
        const linkDistance = 2.8;
        for (let i = 0; i < networkNodeCount; i += 1) {
          const i3 = i * 3;
          for (let j = i + 1; j < networkNodeCount; j += 1) {
            const j3 = j * 3;
            const dx = networkPositions[i3] - networkPositions[j3];
            const dy = networkPositions[i3 + 1] - networkPositions[j3 + 1];
            const dz = networkPositions[i3 + 2] - networkPositions[j3 + 2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (d < linkDistance && segmentCursor < maxNetworkSegments) {
              const offset = segmentCursor * 6;
              networkLinePositions[offset] = networkPositions[i3];
              networkLinePositions[offset + 1] = networkPositions[i3 + 1];
              networkLinePositions[offset + 2] = networkPositions[i3 + 2];
              networkLinePositions[offset + 3] = networkPositions[j3];
              networkLinePositions[offset + 4] = networkPositions[j3 + 1];
              networkLinePositions[offset + 5] = networkPositions[j3 + 2];
              segmentCursor += 1;
            }
          }
        }
        networkLineAttr.needsUpdate = true;
        networkLineGeometry.setDrawRange(0, segmentCursor * 2);

        for (const item of flowParticles) {
          const t = (item.offset + elapsed * item.speed) % 1;
          item.mesh.position.copy(item.curve.getPointAt(t));
        }

        renderer.render(scene, camera);
        rafId = window.requestAnimationFrame(animate);
      };

      animate(startTime);

      cleanup = () => {
        window.cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("scroll", onScroll);

        pathGeoA.dispose();
        pathGeoB.dispose();
        pathMatA.dispose();
        pathMatB.dispose();
        networkGeometry.dispose();
        networkLineGeometry.dispose();
        (networkPoints.material as { dispose?: () => void }).dispose?.();
        (networkLines.material as { dispose?: () => void }).dispose?.();
        bgParticleGeometry.dispose();
        (bgParticles.material as { dispose?: () => void }).dispose?.();

        [internNode, aiNode, companyNode, pulseOrb, resumeModule, skillModule, verifiedModule, pipelineModule].forEach((mesh) => {
          (mesh.geometry as { dispose?: () => void }).dispose?.();
          (mesh.material as { dispose?: () => void }).dispose?.();
        });

        flowParticles.forEach((item) => {
          (item.mesh.geometry as { dispose?: () => void }).dispose?.();
          (item.mesh.material as { dispose?: () => void }).dispose?.();
        });

        renderer.dispose();
        if (renderer.domElement.parentNode === mountEl) {
          mountEl.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none absolute inset-0 z-0 opacity-95" aria-hidden="true" />;
}

export { InteractiveHeroScene } from "@/components/home/InteractiveHeroScene";
