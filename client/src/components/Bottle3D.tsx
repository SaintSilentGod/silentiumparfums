// Silentium — the brand bottle (client/public/models/bottle.glb, built in Blender).
// One shape for every fragrance; each world restyles liquid, glass, cap, label and light.

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type BottleLighting = "candle" | "daylight" | "studio" | "neon" | "gold" | "fog" | "heat";

export interface BottleLook {
  liquid: string;
  liquidOpacity?: number;
  glass?: string;
  cap?: string;
  capRoughness?: number;
  collar?: string;
  lighting: BottleLighting;
  /** Draws the label; the canvas is 1024×626 (label aspect 0.36 : 0.22). */
  drawLabel: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

interface Props extends BottleLook {
  className?: string;
  style?: CSSProperties;
  /** Idle auto-rotation, radians per second. */
  spin?: number;
  /** Camera distance multiplier (bigger = smaller bottle). */
  zoom?: number;
  /** Optional externally driven extra rotation (e.g. scroll-linked drum). */
  rotationRef?: React.MutableRefObject<number>;
  interactive?: boolean;
}

let gltfPromise: Promise<THREE.Group> | null = null;
export function loadBottle() {
  if (!gltfPromise) {
    gltfPromise = new GLTFLoader()
      .loadAsync("/models/bottle.glb")
      .then((g) => g.scene);
  }
  return gltfPromise;
}

export default function Bottle3D({
  liquid, liquidOpacity = 0.9, glass = "#ffffff", cap = "#0c0b0a", capRoughness = 0.85,
  collar = "#c7a874", lighting, drawLabel,
  className, style, spin = 0.25, zoom = 1, rotationRef, interactive = true,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const EXPOSURE: Record<BottleLighting, number> = { candle: 0.95, daylight: 1.15, studio: 1.0, neon: 1.1, gold: 1.05, fog: 1.25, heat: 1.0 };
    const ENV: Record<BottleLighting, number> = { candle: 0.4, daylight: 1.1, studio: 0.85, neon: 0.35, gold: 0.5, fog: 1.3, heat: 0.55 };
    renderer.toneMappingExposure = EXPOSURE[lighting];
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = ENV[lighting];

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

    // Lights per mood
    let flicker: THREE.PointLight | null = null;
    const neonLights: THREE.PointLight[] = [];
    const add = (l: THREE.Light, x: number, y: number, z: number) => { l.position.set(x, y, z); scene.add(l); return l; };
    if (lighting === "candle") {
      flicker = add(new THREE.PointLight(0xffa04a, 9, 7, 1.4), -1.0, -0.1, 1.4) as THREE.PointLight;
      add(new THREE.DirectionalLight(0x8a7aaa, 1.4), 2, 2, -2);
    } else if (lighting === "daylight") {
      add(new THREE.DirectionalLight(0xfff1d6, 2.4), 2, 3, 2.5);
      scene.add(new THREE.HemisphereLight(0xcfe8ff, 0xf3e2b8, 0.8));
    } else if (lighting === "neon") {
      neonLights.push(add(new THREE.PointLight(0xff2bd6, 14, 8, 1.2), -1.4, 0.4, 1.2) as THREE.PointLight);
      neonLights.push(add(new THREE.PointLight(0x22f0ff, 14, 8, 1.2), 1.4, -0.3, 1.0) as THREE.PointLight);
      add(new THREE.DirectionalLight(0xb6ff3b, 0.8), 0, 3, -2);
    } else if (lighting === "gold") {
      add(new THREE.DirectionalLight(0xffcf80, 2.6), -2, 2.5, 2.5);
      add(new THREE.DirectionalLight(0xff6a3a, 1.2), 2.5, 0.5, -1.5);
      add(new THREE.PointLight(0xffe2a8, 4, 5, 1.5), 0.6, -0.6, 1.5);
    } else if (lighting === "fog") {
      scene.add(new THREE.HemisphereLight(0xf2f6f8, 0xc9d2d6, 1.6));
      add(new THREE.DirectionalLight(0xffffff, 0.6), 0, 3, 2);
    } else if (lighting === "heat") {
      add(new THREE.PointLight(0xff7a2a, 10, 7, 1.3), 1.2, -0.8, 1.2);
      add(new THREE.DirectionalLight(0xffd9a8, 1.4), -2, 2.5, 2);
      add(new THREE.DirectionalLight(0x6b3a1a, 0.8), 0, 1, -3);
    } else {
      add(new THREE.DirectionalLight(0xf4f8ff, 1.6), -2, 2.5, 3);
      add(new THREE.DirectionalLight(0xffffff, 0.5), 3, 0.5, 1);
    }

    const pivot = new THREE.Group();
    scene.add(pivot);

    // Label texture
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 1024;
    labelCanvas.height = 626;
    const lctx = labelCanvas.getContext("2d")!;
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.flipY = false;
    labelTex.colorSpace = THREE.SRGBColorSpace;
    labelTex.anisotropy = 8;
    const paintLabel = () => {
      lctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
      drawLabel(lctx, labelCanvas.width, labelCanvas.height);
      labelTex.needsUpdate = true;
    };
    paintLabel();
    // Webfonts may arrive after the first paint
    document.fonts?.ready.then(() => { if (!disposed) paintLabel(); });

    const materials: THREE.Material[] = [];
    loadBottle().then((src) => {
      if (disposed) return;
      const model = src.clone(true);
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const name = mesh.name.toLowerCase();
        let m: THREE.Material;
        if (name.startsWith("glass")) {
          m = new THREE.MeshPhysicalMaterial({
            color: glass, metalness: 0, roughness: 0.04, transparent: true, opacity: lighting === "daylight" || lighting === "fog" ? 0.16 : 0.09,
            clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.5, specularIntensity: 1,
            envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide,
          });
          mesh.renderOrder = 3;
        } else if (name.startsWith("liquid")) {
          m = new THREE.MeshPhysicalMaterial({
            color: liquid, roughness: 0.15, transparent: liquidOpacity < 1, opacity: liquidOpacity,
            clearcoat: 0.6, sheen: 0.4, sheenColor: new THREE.Color(liquid),
            emissive: new THREE.Color(liquid), emissiveIntensity: lighting === "candle" || lighting === "neon" ? 0.14 : 0.05,
          });
          mesh.renderOrder = 1;
        } else if (name.startsWith("cap")) {
          m = new THREE.MeshStandardMaterial({ color: cap, roughness: capRoughness, metalness: 0.05 });
        } else if (name.startsWith("collar")) {
          m = new THREE.MeshStandardMaterial({ color: collar, roughness: 0.28, metalness: 1 });
        } else if (name.startsWith("label")) {
          m = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.75, transparent: true, side: THREE.DoubleSide });
          mesh.renderOrder = 4;
        } else return;
        materials.push(m);
        mesh.material = m;
      });
      // Centre the model at the origin
      const box = new THREE.Box3().setFromObject(model);
      const c = box.getCenter(new THREE.Vector3());
      model.position.sub(c);
      pivot.add(model);
    });

    // Sizing
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const fitH = 1.35 * zoom; // model is ~1.17 tall
      const dist = fitH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * Math.max(1, 0.75 / camera.aspect);
      camera.position.set(0, 0.08, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // Drag to rotate, with inertia
    let yaw = 0.5, vel = 0, dragging = false, lastX = 0, tiltTarget = 0, tilt = 0;
    const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; host.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tiltTarget = ((e.clientY - r.top) / r.height - 0.5) * 0.25;
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      vel = dx * 0.01;
      yaw += vel;
    };
    const onUp = () => { dragging = false; };
    if (interactive) {
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerup", onUp);
      host.addEventListener("pointercancel", onUp);
      host.style.cursor = "grab";
      host.style.touchAction = "pan-y";
    }

    // Only render while visible
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(host);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now(), elapsed = 0;
    const delta = () => { const now = performance.now(); const d = (now - last) / 1000; last = now; return d; };
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) { delta(); return; }
      const dt = Math.min(delta(), 0.05);
      elapsed += dt;
      const t = elapsed;
      if (!dragging) {
        vel *= 0.94;
        yaw += vel + (reduced ? 0 : spin * dt);
      }
      tilt += (tiltTarget - tilt) * 0.06;
      pivot.rotation.y = yaw + (rotationRef?.current ?? 0);
      pivot.rotation.x = tilt;
      pivot.position.y = reduced ? 0 : Math.sin(t * 0.9) * 0.025;
      neonLights.forEach((l, i) => { l.intensity = 12 + Math.sin(t * 2.2 + i * 2) * 5; });
      if (flicker) flicker.intensity = 8.5 + Math.sin(t * 11) * 0.6 + Math.sin(t * 23.7) * 0.4 + Math.random() * 0.5;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      materials.forEach((m) => m.dispose());
      labelTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // drawLabel is a fresh closure each render; the look is fixed per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liquid, liquidOpacity, glass, cap, capRoughness, collar, lighting, spin, zoom, interactive]);

  return <div ref={hostRef} className={className} style={{ position: "relative", ...style }} />;
}
