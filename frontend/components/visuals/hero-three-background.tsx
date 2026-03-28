"use client";

import { useEffect, useRef } from "react";

export function HeroThreeBackground() {
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
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
      camera.position.set(0, 0, 23);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      mountEl.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      const particleCount = 150;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 40;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 24;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 20;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

      const points = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          color: "#7dd3fc",
          size: 0.1,
          transparent: true,
          opacity: 0.85
        })
      );
      group.add(points);

      const connectionCount = 120;
      const linePositions = new Float32Array(connectionCount * 2 * 3);
      for (let i = 0; i < connectionCount; i += 1) {
        const a = Math.floor(Math.random() * particleCount);
        const b = Math.floor(Math.random() * particleCount);
        const ai = a * 3;
        const bi = b * 3;
        const offset = i * 6;
        linePositions[offset] = particlePositions[ai];
        linePositions[offset + 1] = particlePositions[ai + 1];
        linePositions[offset + 2] = particlePositions[ai + 2];
        linePositions[offset + 3] = particlePositions[bi];
        linePositions[offset + 4] = particlePositions[bi + 1];
        linePositions[offset + 5] = particlePositions[bi + 2];
      }

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      const lines = new THREE.LineSegments(
        lineGeometry,
        new THREE.LineBasicMaterial({
          color: "#38bdf8",
          transparent: true,
          opacity: 0.2
        })
      );
      group.add(lines);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(5.2, 24, 24),
        new THREE.MeshBasicMaterial({
          color: "#2563eb",
          transparent: true,
          opacity: 0.16
        })
      );
      glow.position.set(7, 1, -6);
      group.add(glow);

      const mouse = new THREE.Vector2(0, 0);
      const targetMouse = new THREE.Vector2(0, 0);

      const onPointerMove = (event: PointerEvent) => {
        const rect = mountEl.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        targetMouse.set(x, y);
      };

      const onResize = () => {
        const { clientWidth, clientHeight } = mountEl;
        if (!clientWidth || !clientHeight) return;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight, false);
      };

      onResize();
      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      let rafId = 0;
      const animate = () => {
        mouse.lerp(targetMouse, 0.05);
        group.rotation.y = mouse.x * 0.18;
        group.rotation.x = mouse.y * 0.08;
        group.position.x = mouse.x * 1.15;
        group.position.y = mouse.y * 0.85;
        points.rotation.z += 0.0008;
        lines.rotation.z -= 0.0004;

        renderer.render(scene, camera);
        rafId = window.requestAnimationFrame(animate);
      };
      animate();

      cleanup = () => {
        window.cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointerMove);

        particleGeometry.dispose();
        lineGeometry.dispose();
        (points.material as { dispose?: () => void }).dispose?.();
        (lines.material as { dispose?: () => void }).dispose?.();
        (glow.material as { dispose?: () => void }).dispose?.();
        (glow.geometry as { dispose?: () => void }).dispose?.();
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

  return <div ref={mountRef} className="absolute inset-0 -z-10 opacity-95" aria-hidden="true" />;
}
