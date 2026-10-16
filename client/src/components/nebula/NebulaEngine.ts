// Silentium — the emotional nebula.
// Each emotion is a spiral nebula of shader particles. Choosing one flies the camera through it into
// the next layer of space; the last layer holds the brand bottles of the matching fragrances.

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { loadBottle } from "@/components/Bottle3D";

export interface NebulaItem {
  id: string;
  label: string;
  color: string;
  kind: "emotion" | "perfume";
  liquid?: string;
  cap?: string;
}

interface Callbacks {
  onHover: (item: NebulaItem | null) => void;
  onSelect: (item: NebulaItem) => void;
}

interface Node {
  item: NebulaItem;
  group: THREE.Group;
  pos: THREE.Vector3;
  radius: number;
  mat: THREE.ShaderMaterial;
  hit: THREE.Mesh;
  label: HTMLButtonElement;
  intensity: number;
  bottle?: THREE.Object3D;
}

interface Layer {
  center: THREE.Vector3;
  focus: THREE.Vector3; // where the camera looks: a bit above centre so the ring sits below the heading
  camPos: THREE.Vector3;
  root: THREE.Group;
  nodes: Node[];
  mats: THREE.ShaderMaterial[];
  opacity: number;
  target: number;
  via?: THREE.Vector3; // position of the node we flew through to get here
  revealAt?: number; // flight progress after which this layer fades in
}

const LAYER_GAP = 130;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uIntensity;
  uniform float uSpin;
  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float r = length(p.xz);
    float ang = uTime * uSpin / (0.6 + r * 0.12);
    float s = sin(ang), c = cos(ang);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.y += sin(uTime * 0.6 + aPhase * 6.2831) * 0.12;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.7 + 0.3 * sin(uTime * 1.7 + aPhase * 40.0);
    float d = -mv.z;
    gl_PointSize = min(uSize * aScale * uPixelRatio * (1.0 + uIntensity * 0.45) * tw / max(d, 0.1), 180.0 * uPixelRatio);
    vColor = aColor * (0.75 + uIntensity * 0.7);
    vAlpha = smoothstep(520.0, 140.0, d) * smoothstep(3.0, 20.0, d);
  }
`;
const FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.7);
    gl_FragColor = vec4(vColor, a * uOpacity * vAlpha);
  }
`;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function makeMaterial(pixelRatio: number, size: number, spin: number) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: size }, uPixelRatio: { value: pixelRatio },
      uIntensity: { value: 0 }, uOpacity: { value: 0 }, uSpin: { value: spin },
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// Spiral nebula particles, local to its group
function nebulaGeometry(color: THREE.Color, radius: number, count: number) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const scale = new Float32Array(count), phase = new Float32Array(count);
  const white = new THREE.Color("#fff6ee");
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  const dust = new THREE.Color().setHSL((hsl.h + 0.08 + Math.random() * 0.1) % 1, Math.min(1, hsl.s + 0.1), 0.55);
  const arms = 2 + Math.floor(Math.random() * 3);
  const twist = rand(0.35, 0.8);
  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const haze = i < count * 0.035;
    const r = haze ? rand(0.1, 0.8) * radius : Math.pow(Math.random(), 1.6) * radius;
    const arm = Math.floor(Math.random() * arms);
    const a = (arm / arms) * Math.PI * 2 + r * twist + gauss() * (0.5 - (r / radius) * 0.25);
    pos[i * 3] = Math.cos(a) * r + gauss() * 0.6;
    pos[i * 3 + 1] = gauss() * (1 - r / radius) * radius * 0.22 + gauss() * 0.3;
    pos[i * 3 + 2] = Math.sin(a) * r + gauss() * 0.6;
    const k = r / radius;
    tmp.copy(white).lerp(color, Math.min(1, k * 1.6));
    if (Math.random() < 0.18) tmp.lerp(dust, 0.7);
    const bright = haze ? 0.16 : 1;
    col[i * 3] = tmp.r * bright; col[i * 3 + 1] = tmp.g * bright; col[i * 3 + 2] = tmp.b * bright;
    scale[i] = haze ? rand(30, 60) : Math.random() < 0.02 ? rand(5, 9) : rand(0.6, 2.4);
    phase[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  return g;
}

// Glowing thread of particles between two points (in layer space)
function filamentGeometry(from: THREE.Vector3, to: THREE.Vector3, color: THREE.Color, count = 220) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const scale = new Float32Array(count), phase = new Float32Array(count);
  const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(rand(-6, 6), rand(-6, 6), rand(-4, 4)));
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    curve.getPoint(t, p);
    pos[i * 3] = p.x + gauss() * 0.5; pos[i * 3 + 1] = p.y + gauss() * 0.5; pos[i * 3 + 2] = p.z + gauss() * 0.5;
    const fade = Math.sin(t * Math.PI) * 0.6 + 0.2;
    col[i * 3] = color.r * fade; col[i * 3 + 1] = color.g * fade; col[i * 3 + 2] = color.b * fade;
    scale[i] = rand(0.4, 1.4);
    phase[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  return g;
}

function labelTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 626;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#efe7da"; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#1a1612"; ctx.lineWidth = 4; ctx.strokeRect(28, 28, c.width - 56, c.height - 56);
  ctx.fillStyle = "#1a1612"; ctx.textAlign = "center";
  ctx.font = "italic 300 96px 'Cormorant Garamond', serif";
  const words = text.split(" ");
  const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [text];
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, c.height * (lines.length === 1 ? 0.55 : 0.45 + i * 0.2)));
  ctx.font = "28px 'JetBrains Mono', monospace"; ctx.fillText("S I L E N T I U M", c.width / 2, c.height * 0.86);
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class NebulaEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private stars: THREE.Points;
  private starMat: THREE.ShaderMaterial;
  private layers: Layer[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(9, 9);
  private parallax = new THREE.Vector2();
  private hovered: Node | null = null;
  private clock = new THREE.Clock();
  private raf = 0;
  private flight: { curve: THREE.CatmullRomCurve3; lookFrom: THREE.Vector3; lookTo: THREE.Vector3; through: boolean; t: number; dur: number; done: () => void; gate?: { node: Node; entering: boolean } } | null = null;
  private look = new THREE.Vector3();
  private base = new THREE.Vector3(); // camera position before the parallax offset
  private offset = new THREE.Vector3(); // smoothed pointer parallax + idle drift, applied at all times
  private bottleLights: THREE.PointLight[] = [];
  private disposables: { dispose: () => void }[] = [];
  private envTex: THREE.Texture;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private visible = true;
  private io: IntersectionObserver;
  private ro: ResizeObserver;

  constructor(private host: HTMLElement, private labelHost: HTMLElement, private cb: Callbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x030208, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
    this.camera.position.set(0, 0, 90);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.7;
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(-30, 40, 60);
    this.scene.add(key, new THREE.AmbientLight(0x6a5a8a, 0.6));
    for (let i = 0; i < 3; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 40, 2);
      this.scene.add(l);
      this.bottleLights.push(l);
    }

    // Far starfield
    const N = 4000, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3), ss = new Float32Array(N), ph = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(gauss(), gauss(), gauss()).normalize().multiplyScalar(rand(500, 900));
      sp.set([v.x, v.y, v.z], i * 3);
      const t = Math.random();
      const c = new THREE.Color().setHSL(0.6 + t * 0.35, 0.4, 0.75);
      sc.set([c.r, c.g, c.b], i * 3);
      ss[i] = Math.random() < 0.03 ? rand(6, 12) : rand(1.5, 4);
      ph[i] = Math.random();
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    sg.setAttribute("aColor", new THREE.BufferAttribute(sc, 3));
    sg.setAttribute("aScale", new THREE.BufferAttribute(ss, 1));
    sg.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
    this.starMat = new THREE.ShaderMaterial({
      vertexShader: VERT.replace("smoothstep(520.0, 140.0, d) * smoothstep(3.0, 20.0, d)", "1.0"),
      fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 }, uSize: { value: 260 }, uPixelRatio: { value: this.renderer.getPixelRatio() }, uIntensity: { value: 0 }, uOpacity: { value: 0.9 }, uSpin: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(sg, this.starMat);
    this.scene.add(this.stars);
    this.disposables.push(sg, this.starMat);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(host);

    host.addEventListener("pointermove", this.onMove);
    host.addEventListener("pointerleave", this.onLeave);
    host.addEventListener("click", this.onClick);
    this.warmUp();
    if (import.meta.env.DEV) (window as unknown as { __nebula?: NebulaEngine }).__nebula = this;
    this.tick();
  }

  get busy() { return !!this.flight; }

  // Compile the bottle's shaders up front, off-screen, so the last layer appears without a hitch.
  private warmUp() {
    loadBottle().then((src) => {
      if (this.disposed) return;
      const probe = this.makeBottle(src, { id: "_", label: "", color: "#fff", kind: "perfume" });
      probe.position.set(0, -9999, 0);
      this.scene.add(probe);
      const done = () => { this.scene.remove(probe); };
      (this.renderer.compileAsync ? this.renderer.compileAsync(this.scene, this.camera) : Promise.resolve(this.renderer.compile(this.scene, this.camera))).then(done, done);
    });
  }
  private disposed = false;
  get depth() { return this.layers.length; }

  private resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private ringPositions(n: number, center: THREE.Vector3) {
    const aspect = this.camera.aspect;
    const R = n <= 1 ? 0 : n <= 2 ? 22 : n <= 3 ? 27 : 36;
    const sx = aspect >= 1 ? 1.35 : 0.62;
    const sy = aspect >= 1 ? 0.62 : 1.25;
    const off = rand(-0.4, 0.4) + (n === 2 ? 0 : -Math.PI / 2);
    return Array.from({ length: n }, (_, i) => {
      const a = off + (i / n) * Math.PI * 2;
      return center.clone().add(new THREE.Vector3(Math.cos(a) * R * sx, Math.sin(a) * R * sy, rand(-7, 7)));
    });
  }

  private cameraFor(center: THREE.Vector3, n: number, kind: NebulaItem["kind"]) {
    const R = n <= 1 ? 0 : n <= 2 ? 22 : n <= 3 ? 27 : 36;
    const aspect = this.camera.aspect;
    const half = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const rx = R * (aspect >= 1 ? 1.35 : 0.62) + 14, ry = R * (aspect >= 1 ? 0.62 : 1.25) + 24; // room for the labels under each nebula
    const d = Math.max(ry / Math.tan(half), rx / (Math.tan(half) * aspect)) * (kind === "perfume" ? 0.85 : 1.05);
    return center.clone().add(new THREE.Vector3(0, 4, Math.max(d, kind === "perfume" ? 64 : 55)));
  }

  private buildLayer(items: NebulaItem[], center: THREE.Vector3, coreColor: string | null): Layer {
    const root = new THREE.Group();
    this.scene.add(root);
    const pr = this.renderer.getPixelRatio();
    const mats: THREE.ShaderMaterial[] = [];
    const kind = items[0]?.kind ?? "emotion";
    const positions = this.ringPositions(items.length, center);

    // Core of the layer — the emotion we came from (or the origin)
    const coreCol = new THREE.Color(coreColor ?? "#e9dcff");
    const coreMat = makeMaterial(pr, 110, 0.35);
    const core = new THREE.Points(nebulaGeometry(coreCol, 4, 900), coreMat);
    core.position.copy(center);
    core.rotation.x = 1.2;
    root.add(core);
    mats.push(coreMat);

    const nodes: Node[] = items.map((item, i) => {
      const color = new THREE.Color(item.color);
      const pos = positions[i];
      const radius = kind === "perfume" ? 13 : items.length > 4 ? 12 : 14;
      const group = new THREE.Group();
      group.position.copy(pos);
      root.add(group);
      const mat = makeMaterial(pr, kind === "perfume" ? 190 : 170, kind === "perfume" ? 0.12 : 0.28);
      const cloud = new THREE.Points(nebulaGeometry(color, radius, kind === "perfume" ? 1400 : 2600), mat);
      cloud.rotation.set(rand(0.7, 1.25), rand(0, Math.PI), rand(-0.3, 0.3));
      if (kind === "perfume") cloud.position.z = -7;
      group.add(cloud);
      mats.push(mat);

      // filament from the core
      const fMat = makeMaterial(pr, 120, 0);
      const fil = new THREE.Points(filamentGeometry(center.clone().sub(pos), new THREE.Vector3(), color), fMat);
      group.add(fil);
      mats.push(fMat);

      const hit = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.85, 12, 12), new THREE.MeshBasicMaterial({ visible: false }));
      hit.userData.nodeIndex = i;
      group.add(hit);

      const label = document.createElement("button");
      label.className = `nebula-label nebula-label--${kind}`;
      label.type = "button";
      label.innerHTML = `<span class="nebula-label__dot" style="background:${item.color};box-shadow:0 0 12px ${item.color}"></span><span class="nebula-label__text"></span>${kind === "perfume" ? '<span class="nebula-label__cta">→</span>' : ""}`;
      (label.querySelector(".nebula-label__text") as HTMLElement).textContent = item.label;
      label.style.opacity = "0";
      this.labelHost.appendChild(label);

      const node: Node = { item, group, pos, radius, mat, hit, label, intensity: 0 };
      label.addEventListener("pointerenter", () => this.setHover(node));
      label.addEventListener("pointerleave", () => this.setHover(null));
      label.addEventListener("focus", () => this.setHover(node));
      label.addEventListener("blur", () => this.setHover(null));
      label.addEventListener("click", (e) => { e.stopPropagation(); this.select(node); });

      if (kind === "perfume") this.attachBottle(node, i);
      return node;
    });

    return { center: center.clone(), focus: center.clone().add(new THREE.Vector3(0, 4, 0)), camPos: this.cameraFor(center, items.length, kind), root, nodes, mats, opacity: 0, target: 1 };
  }

  private makeBottle(src: THREE.Group, item: NebulaItem) {
    const model = src.clone(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const s = 19 / size.y;
    model.scale.setScalar(s);
    model.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(s));
    const holder = new THREE.Group();
    holder.add(model);
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const n = mesh.name.toLowerCase();
      let m: THREE.Material;
      if (n.startsWith("glass")) { m = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.03, transparent: true, opacity: 0.14, clearcoat: 1, envMapIntensity: 1.8, depthWrite: false }); mesh.renderOrder = 3; }
      else if (n.startsWith("liquid")) { const c = new THREE.Color(item.liquid ?? item.color); m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.15, clearcoat: 0.6, emissive: c, emissiveIntensity: 0.3 }); mesh.renderOrder = 1; }
      else if (n.startsWith("cap")) m = new THREE.MeshStandardMaterial({ color: item.cap ?? "#111", roughness: 0.7 });
      else if (n.startsWith("collar")) m = new THREE.MeshStandardMaterial({ color: "#d9b77a", metalness: 1, roughness: 0.3 });
      else if (n.startsWith("label")) { const tex = labelTexture(item.label || " "); this.disposables.push(tex); m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }); mesh.renderOrder = 4; }
      else return;
      this.disposables.push(m);
      mesh.material = m;
    });
    return holder;
  }

  private attachBottle(node: Node, index: number) {
    loadBottle().then((src) => {
      if (!node.group.parent || this.disposed) return;
      const holder = this.makeBottle(src, node.item);
      holder.rotation.y = rand(-0.6, 0.6);
      holder.scale.setScalar(0.001);
      node.group.add(holder);
      node.bottle = holder;
      const light = this.bottleLights[index];
      if (light) {
        light.color.set(node.item.color);
        light.position.copy(node.pos).add(new THREE.Vector3(6, 4, 10));
        light.userData.target = 300;
      }
    });
  }

  private disposeLayer(layer: Layer) {
    layer.nodes.forEach((n) => { n.label.remove(); n.hit.geometry.dispose(); (n.hit.material as THREE.Material).dispose(); });
    layer.root.traverse((o) => { const p = o as THREE.Points; if (p.isPoints) p.geometry.dispose(); });
    layer.mats.forEach((m) => m.dispose());
    this.scene.remove(layer.root);
  }

  private fly(to: THREE.Vector3, through: THREE.Vector3 | null, lookFrom: THREE.Vector3, lookTo: THREE.Vector3, dur: number, done: () => void) {
    const from = this.base.clone();
    let pts: THREE.Vector3[];
    if (through) {
      // pass straight through the nebula along z, in whichever direction we are travelling
      const dir = Math.sign(to.z - from.z) || -1;
      pts = [from, through.clone().add(new THREE.Vector3(0, 0, -dir * 14)), through.clone().add(new THREE.Vector3(0, 0, dir * 14)), to.clone()];
    } else {
      pts = [from, from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 5, 0)), to.clone()];
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    const len = curve.getLength();
    const time = THREE.MathUtils.clamp(dur * Math.sqrt(len / 150), dur * 0.8, 4.6);
    const flight = { curve, lookFrom: this.look.clone(), lookTo: lookTo.clone(), through: !!through, t: 0, dur: this.reduced ? 0.6 : time, done } as NonNullable<NebulaEngine["flight"]>;
    this.flight = flight;
    void lookFrom;
    return flight;
  }

  /** Add a layer. With `throughId`, fly through that node of the current layer into the new one. */
  push(items: NebulaItem[], throughId?: string) {
    const prev = this.layers[this.layers.length - 1];
    const via = throughId ? prev?.nodes.find((n) => n.item.id === throughId) : undefined;
    const center = via ? via.pos.clone().add(new THREE.Vector3(0, 0, -LAYER_GAP)) : new THREE.Vector3();
    const layer = this.buildLayer(items, center, via ? via.item.color : null);
    layer.via = via?.pos.clone();
    this.layers.push(layer);
    this.setHover(null);
    if (!prev) {
      this.base.copy(layer.camPos).add(new THREE.Vector3(0, 10, 80));
      this.look.copy(layer.focus);
      this.fly(layer.camPos, null, layer.focus, layer.focus, 2.6, () => {});
      return;
    }
    prev.target = 0;
    layer.revealAt = 0.42; // the new layer starts to glow once we're through the gate
    const fl = this.fly(layer.camPos, via ? via.pos : null, prev.focus, layer.focus, 3.0, () => {});
    if (via) fl.gate = { node: via, entering: true };
  }

  /** Go back one layer, flying back out through the node we entered by. */
  pop() {
    if (this.layers.length < 2 || this.flight) return;
    const top = this.layers.pop()!;
    const below = this.layers[this.layers.length - 1];
    below.target = 1;
    below.revealAt = 0.35;
    top.target = 0;
    this.setHover(null);
    const fl = this.fly(below.camPos, top.via ?? null, top.focus, below.focus, 2.6, () => this.disposeLayer(top));
    const gateNode = top.via ? below.nodes.find((n) => n.pos.equals(top.via!)) : undefined;
    if (gateNode) fl.gate = { node: gateNode, entering: false };
  }

  /** Rewind to the first layer (it is kept alive, so nothing is rebuilt). */
  reset() {
    if (this.layers.length < 2 || this.flight) return;
    const root = this.layers[0];
    const gone = this.layers.slice(1);
    this.layers = [root];
    gone.forEach((l) => { l.target = 0; });
    root.target = 1;
    root.revealAt = 0.45;
    this.setHover(null);
    this.fly(root.camPos, null, gone[gone.length - 1].focus, root.focus, 2.8, () => gone.forEach((l) => this.disposeLayer(l)));
  }

  relabel(fn: (item: NebulaItem) => string) {
    this.layers.forEach((l) => l.nodes.forEach((n) => {
      n.item.label = fn(n.item);
      (n.label.querySelector(".nebula-label__text") as HTMLElement).textContent = n.item.label;
    }));
  }

  private setHover(node: Node | null) {
    if (this.hovered === node) return;
    this.hovered = node;
    this.host.style.cursor = node ? "pointer" : "default";
    this.cb.onHover(node ? node.item : null);
  }

  private select(node: Node) {
    if (this.flight) return;
    const top = this.layers[this.layers.length - 1];
    if (!top || !top.nodes.includes(node)) return;
    this.cb.onSelect(node.item);
  }

  private onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = this.host.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.parallax.set(this.pointer.x, this.pointer.y);
  };
  private onLeave = (e: PointerEvent) => {
    if (e.pointerType === "touch") return; this.pointer.set(9, 9); this.parallax.set(0, 0); if (!(document.activeElement as HTMLElement)?.classList?.contains("nebula-label")) this.setHover(null); };
  // Resolve the click from its own coordinates: on touch screens the pointer "leaves" (clearing the
  // hover) before the click event arrives, so relying on the hover state made taps do nothing.
  private onClick = (e: MouseEvent) => {
    const node = this.nodeAt(e.clientX, e.clientY);
    if (node) { this.setHover(node); this.select(node); }
  };

  private nodeAt(clientX: number, clientY: number): Node | null {
    const top = this.layers[this.layers.length - 1];
    if (!top || this.flight) return null;
    const r = this.host.getBoundingClientRect();
    const p = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(p, this.camera);
    const hits = this.raycaster.intersectObjects(top.nodes.map((n) => n.hit), false);
    return hits.length ? top.nodes[hits[0].object.userData.nodeIndex as number] : null;
  }

  private pick() {
    const top = this.layers[this.layers.length - 1];
    if (!top || this.flight || this.pointer.x > 2) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(top.nodes.map((n) => n.hit), false);
    const node = hits.length ? top.nodes[hits[0].object.userData.nodeIndex as number] : null;
    if (node || !(document.activeElement as HTMLElement)?.classList?.contains("nebula-label")) this.setHover(node);
  }

  private time = 0;
  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    if (!this.visible) { this.clock.getDelta(); return; }
    this.step(Math.min(this.clock.getDelta(), 0.05));
  };

  /** Dev-only: advance the simulation by `seconds` without waiting for frames. */
  debugAdvance(seconds: number) {
    for (let i = 0; i < seconds * 60; i++) this.step(1 / 60);
  }

  private step(dt: number) {
    this.time += dt;
    const t = this.time;

    const k60 = (rate: number) => 1 - Math.pow(1 - rate, dt * 60); // frame-rate independent smoothing
    const top0 = this.layers[this.layers.length - 1];
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + dt / f.dur);
      const u = ease(f.t);
      this.base.copy(f.curve.getPointAt(u));
      // All layers lie along -z, so the camera always faces -z while travelling (forward, back or
      // rewinding) and only hands over to the destination's focus at the end — no flips mid-flight.
      const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
      const forwardLook = this.base.clone().add(new THREE.Vector3(0, 0, -55));
      this.look.copy(f.lookFrom).lerp(forwardLook, smooth(0, 0.3, f.t)).lerp(f.lookTo, smooth(0.65, 1, f.t));
      if (f.t >= 1) { this.flight = null; this.look.copy(f.lookTo); f.done(); }
    } else if (top0) {
      this.base.lerp(top0.camPos, k60(0.05));
      this.look.lerp(top0.focus, k60(0.06));
      this.pick();
    }
    const want = new THREE.Vector3(this.parallax.x * 5 + Math.sin(t * 0.15) * 1.5, this.parallax.y * 3 + Math.cos(t * 0.12) * 1, 0);
    this.offset.lerp(want, k60(this.flight ? 0.02 : 0.04));
    this.camera.position.copy(this.base).add(this.offset);
    this.camera.lookAt(this.look);

    this.bottleLights.forEach((l) => { l.intensity += ((top0?.nodes[0]?.item.kind === "perfume" ? (l.userData.target ?? 0) : 0) - l.intensity) * k60(0.05); });

    this.starMat.uniforms.uTime.value = t;
    this.stars.rotation.y = t * 0.004;

    const top = this.layers[this.layers.length - 1];
    const w = this.host.clientWidth, h = this.host.clientHeight;
    const v = new THREE.Vector3();
    this.layers.forEach((layer) => {
      const gated = layer.revealAt !== undefined && this.flight && this.flight.t < layer.revealAt;
      if (!gated) { layer.opacity += (layer.target - layer.opacity) * k60(layer.target > layer.opacity ? 0.05 : 0.08); if (!this.flight) layer.revealAt = undefined; }
      layer.mats.forEach((m) => { m.uniforms.uTime.value = t; m.uniforms.uOpacity.value = layer.opacity; });
      // the nebula we fly through stays lit until the camera has passed it (or lights up early on the way back)
      const g = this.flight?.gate;
      if (g && layer.nodes.includes(g.node)) {
        const ft = this.flight!.t;
        const sm = (a: number, b: number) => { const k = Math.min(1, Math.max(0, (ft - a) / (b - a))); return k * k * (3 - 2 * k); };
        const gateOpacity = g.entering ? 1 - sm(0.5, 0.72) : sm(0.05, 0.3);
        g.node.mat.uniforms.uOpacity.value = Math.max(layer.opacity, gateOpacity);
      }
      layer.nodes.forEach((n) => {
        const hoverWant = this.hovered === n ? 1 : 0;
        n.intensity += (hoverWant - n.intensity) * k60(0.12);
        n.mat.uniforms.uIntensity.value = n.intensity;
        const s = 0.55 + 0.45 * Math.min(1, layer.opacity) + n.intensity * 0.06;
        n.group.scale.setScalar(s);
        if (n.bottle) {
          const target = Math.min(1, layer.opacity) * (1 + n.intensity * 0.1);
          n.bottle.scale.setScalar(THREE.MathUtils.lerp(n.bottle.scale.x, target, k60(0.08)));
          n.bottle.rotation.y += dt * (0.25 + n.intensity * 1.2);
          n.bottle.position.y = Math.sin(t * 0.9 + n.pos.x) * 0.6;
        }
        // label
        const isTop = layer === top;
        v.copy(n.pos).add(new THREE.Vector3(0, n.item.kind === "perfume" ? -13 : -(n.radius * 0.75) - 2, 0)).project(this.camera);
        const behind = v.z > 1;
        const show = isTop && !behind && layer.opacity > 0.55;
        n.label.style.opacity = show ? String(Math.min(1, (layer.opacity - 0.55) * 3)) : "0";
        n.label.style.pointerEvents = show && !this.flight ? "auto" : "none";
        n.label.tabIndex = show ? 0 : -1;
        n.label.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, 0)`;
        n.label.classList.toggle("is-hover", this.hovered === n);
      });
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    this.host.removeEventListener("pointermove", this.onMove);
    this.host.removeEventListener("pointerleave", this.onLeave);
    this.host.removeEventListener("click", this.onClick);
    this.layers.forEach((l) => this.disposeLayer(l));
    this.disposables.forEach((d) => d.dispose());
    this.envTex.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
