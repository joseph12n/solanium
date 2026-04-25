'use client';

/**
 * Particles — background WebGL mouse-reactive inspirado en ReactBits.
 * Usa `ogl` (ya incluido en package.json). Las partículas dejan una
 * estela alrededor del cursor y pulsan sutilmente.
 *
 * - variant="particles"  → puntos ligeros, universal dark/light
 * - variant="aurora"     → gradiente líquido animado (usa fragmentShader)
 * - color                → hex string — si undefined lee `--brand-primary`
 */

import { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Geometry, Triangle } from 'ogl';

type Variant = 'particles' | 'aurora';

interface ParticlesProps {
  variant?: Variant;
  color?: string;
  count?: number;
  className?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readAccent(): [number, number, number] {
  if (typeof window === 'undefined') return [0.43, 0.34, 0.81];
  const styles = getComputedStyle(document.documentElement);
  const brand = styles.getPropertyValue('--brand-primary').trim();
  if (brand && brand.startsWith('#')) return hexToRgb(brand);
  return [0.43, 0.34, 0.81];
}

// ── Particles variant ─────────────────────────────────────────────────
const PARTICLE_VERT = /* glsl */ `
attribute vec3 position;
attribute float random;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform vec2 uMouse;
uniform float uSize;
varying float vRandom;
void main() {
  vRandom = random;
  vec3 p = position;
  float d = distance(p.xy, uMouse);
  float push = smoothstep(0.6, 0.0, d) * 0.25;
  vec2 dir = normalize(p.xy - uMouse + vec2(0.0001));
  p.xy += dir * push;
  p.x += sin(uTime * 0.5 + random * 6.28) * 0.015;
  p.y += cos(uTime * 0.4 + random * 6.28) * 0.015;
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (1.0 + random) * (1.0 + push * 4.0);
}
`;

const PARTICLE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vRandom;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.0, d) * (0.35 + vRandom * 0.5);
  gl_FragColor = vec4(uColor, alpha);
}
`;

// ── Aurora variant (full-screen plane) ────────────────────────────────
const AURORA_VERT = /* glsl */ `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const AURORA_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uColor;
uniform vec3 uAlt;

// simplex noise (stefan gustavson)
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv * 2.0 - 1.0;
  p.x += sin(uTime * 0.1) * 0.1;
  float dist = distance(uv, uMouse);
  float pull = smoothstep(0.6, 0.0, dist) * 0.3;
  float n1 = snoise(p * 1.6 + vec2(uTime * 0.08, 0.0)) * 0.5 + 0.5;
  float n2 = snoise(p * 2.4 + vec2(0.0, uTime * 0.06)) * 0.5 + 0.5;
  float mask = smoothstep(0.25, 0.85, n1 * 0.6 + n2 * 0.4 + pull);
  vec3 col = mix(uColor, uAlt, n2);
  gl_FragColor = vec4(col, mask * 0.55);
}
`;

export default function Particles({
  variant = 'particles',
  color,
  count = 160,
  className,
}: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    const camera = new Camera(gl, { fov: 35 });
    camera.position.z = 5;

    const scene = new Transform();
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const baseColor = color ? hexToRgb(color) : readAccent();
    const altColor: [number, number, number] = [0.13, 0.82, 0.78];

    let mesh: Mesh | null = null;

    if (variant === 'particles') {
      const positions = new Float32Array(count * 3);
      const randoms = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 3.5;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
        positions[i * 3 + 2] = 0;
        randoms[i] = Math.random();
      }
      const geometry = new Geometry(gl, {
        position: { size: 3, data: positions },
        random: { size: 1, data: randoms },
      });
      const program = new Program(gl, {
        vertex: PARTICLE_VERT,
        fragment: PARTICLE_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: [0, 0] },
          uSize: { value: 2.2 * (window.devicePixelRatio || 1) },
          uColor: { value: baseColor },
        },
        transparent: true,
        depthTest: false,
      });
      mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });
      mesh.setParent(scene);
    } else {
      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex: AURORA_VERT,
        fragment: AURORA_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: [0.5, 0.5] },
          uColor: { value: baseColor },
          uAlt: { value: altColor },
        },
        transparent: true,
        depthTest: false,
      });
      mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
    }

    function resize() {
      if (!container) return;
      renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    }
    resize();
    window.addEventListener('resize', resize);

    function onMove(e: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      if (variant === 'particles') {
        mouse.tx = (x - 0.5) * 3.5;
        mouse.ty = (y - 0.5) * 2.2;
      } else {
        mouse.tx = x;
        mouse.ty = y;
      }
    }
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    const start = performance.now();

    function loop() {
      raf = requestAnimationFrame(loop);
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      const t = (performance.now() - start) / 1000;
      if (mesh) {
        mesh.program.uniforms.uTime.value = t;
        mesh.program.uniforms.uMouse.value = [mouse.x, mouse.y];
      }
      renderer.render({ scene, camera });
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      try {
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      } catch {}
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
    };
  }, [variant, color, count]);

  return <div ref={containerRef} className={className ?? 'bg-canvas'} aria-hidden />;
}
