/* =========================================================================
   Hero 3D — a distorted, noisy, fresnel-glowing sphere in the style of
   Lusion's signature hero object. Pure Three.js with a custom shader.
   Falls back silently if WebGL is unavailable or the user prefers reduced
   motion. Safe to edit — tweak the CONFIG block at the top to iterate.
   ========================================================================= */

import * as THREE from "three";

const CONFIG = {
  color:       "#0b7a3d",   // base sphere color — match --accent in styles.css
  glow:        "#63e2a1",   // rim / fresnel highlight
  radius:      1.25,        // sphere size in world units
  detail:      96,          // geometry subdivisions (higher = smoother distortion)
  noiseScale:  1.6,         // how busy the surface noise is
  noiseAmount: 0.24,        // how much the surface warps
  noiseSpeed:  0.25,        // animation speed of the noise
  rotateSpeed: 0.12,        // idle Y rotation
  mouseTilt:   0.35,        // how much the mouse tilts the sphere
  fresnelPow:  2.2,         // edge-glow falloff
  alpha:       true         // transparent background
};

const canvas = document.getElementById("gl");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

if (canvas && hasWebGL() && !prefersReduced) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 3.6);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: CONFIG.alpha,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ---- Shader ----------------------------------------------------------
  const uniforms = {
    uTime:        { value: 0 },
    uNoiseScale:  { value: CONFIG.noiseScale },
    uNoiseAmount: { value: CONFIG.noiseAmount },
    uColor:       { value: new THREE.Color(CONFIG.color) },
    uGlow:        { value: new THREE.Color(CONFIG.glow) },
    uFresnelPow:  { value: CONFIG.fresnelPow }
  };

  const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uNoiseScale;
    uniform float uNoiseAmount;

    varying vec3 vNormal;
    varying vec3 vViewPos;
    varying float vDisp;

    // ----- Simplex noise (Ashima) -----
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vec3 p = position;
      float n = snoise(p * uNoiseScale + uTime);
      float n2 = snoise(p * uNoiseScale * 2.0 - uTime * 0.7) * 0.5;
      float disp = (n + n2) * uNoiseAmount;
      vec3 displaced = p + normal * disp;

      vDisp = disp;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
      vViewPos = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uGlow;
    uniform float uFresnelPow;

    varying vec3 vNormal;
    varying vec3 vViewPos;
    varying float vDisp;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(vViewPos);
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), uFresnelPow);

      vec3 base = mix(uColor * 0.25, uColor, 0.7 + vDisp * 1.5);
      vec3 col  = mix(base, uGlow, fresnel);
      col += fresnel * 0.35;

      float alpha = clamp(fresnel * 1.1 + 0.18, 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide
  });

  const geometry = new THREE.IcosahedronGeometry(CONFIG.radius, CONFIG.detail / 16 | 0);
  // Higher detail: use a denser sphere for smoother displacement
  const denseGeom = new THREE.SphereGeometry(CONFIG.radius, CONFIG.detail, CONFIG.detail);
  geometry.dispose();

  const mesh = new THREE.Mesh(denseGeom, material);
  scene.add(mesh);

  // A second, smaller inner sphere for depth
  const innerMat = new THREE.ShaderMaterial({
    uniforms: {
      ...uniforms,
      uNoiseAmount: { value: CONFIG.noiseAmount * 0.5 },
      uColor: { value: new THREE.Color(CONFIG.color).multiplyScalar(0.6) },
      uGlow:  { value: new THREE.Color(CONFIG.glow) },
      uFresnelPow: { value: 1.8 },
      uNoiseScale: { value: CONFIG.noiseScale * 0.8 },
      uTime: uniforms.uTime
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false
  });
  const innerMesh = new THREE.Mesh(
    new THREE.SphereGeometry(CONFIG.radius * 0.78, CONFIG.detail / 2, CONFIG.detail / 2),
    innerMat
  );
  scene.add(innerMesh);

  // ---- Interaction ----------------------------------------------------
  let targetRotX = 0, targetRotY = 0;
  let rotX = 0, rotY = 0;
  let lastMove = performance.now();

  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotX = y * CONFIG.mouseTilt;
    targetRotY = x * CONFIG.mouseTilt;
    lastMove = performance.now();
  }, { passive: true });

  // Touch tilt for mobile
  window.addEventListener("touchmove", (e) => {
    if (!e.touches[0]) return;
    const x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    const y = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
    targetRotX = y * CONFIG.mouseTilt;
    targetRotY = x * CONFIG.mouseTilt;
    lastMove = performance.now();
  }, { passive: true });

  // ---- Resize ---------------------------------------------------------
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // ---- Loop — pause rendering when hero is offscreen ------------------
  let visible = true;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { visible = e.isIntersecting; });
  });
  io.observe(canvas);

  const t0 = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible) return;

    const t = (now - t0) * 0.001 * CONFIG.noiseSpeed;
    uniforms.uTime.value = t;

    // Ease toward mouse target; drift gently when idle
    const idle = (now - lastMove) > 2000;
    if (idle) {
      targetRotX = Math.sin(now * 0.0003) * 0.08;
      targetRotY = Math.cos(now * 0.0002) * 0.12;
    }
    rotX += (targetRotX - rotX) * 0.05;
    rotY += (targetRotY - rotY) * 0.05;

    mesh.rotation.x = rotX;
    mesh.rotation.y = rotY + now * 0.0001 * CONFIG.rotateSpeed;
    innerMesh.rotation.x = -rotX * 0.8;
    innerMesh.rotation.y = -rotY * 0.8 - now * 0.00015 * CONFIG.rotateSpeed;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  // ---- Graceful teardown on pagehide ---------------------------------
  window.addEventListener("pagehide", () => {
    renderer.dispose();
    denseGeom.dispose();
    material.dispose();
    innerMat.dispose();
  });
}
