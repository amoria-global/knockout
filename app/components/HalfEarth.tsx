"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── Location markers (lon, lat) ──
const LOCATIONS: [number, number][] = [
  // Africa
  [29.87, -1.94], [32.58, 0.35], [36.8, -1.3], [28.05, -26.2],
  [3.39, 6.45], [31.23, 30.04], [7.49, 9.06], [-17.47, 14.69],
  [47.15, 2.05],
  // Europe
  [-0.1, 51.5], [2.3, 48.9], [13.4, 52.5], [12.5, 41.9],
  [-3.7, 40.4], [14.4, 50.1], [18.07, 59.33], [23.7, 37.97],
  [21.01, 52.23], [4.35, 50.85], [10.75, 59.91], [26.1, 44.43],
  // Middle East
  [55.27, 25.2], [44.37, 33.31],
  // Asia
  [72.88, 19.08], [77.21, 28.61], [88.36, 22.57], [103.82, 1.35],
  [100.5, 13.75], [106.85, -6.21], [139.69, 35.69], [116.4, 39.9],
  [126.98, 37.57], [121.47, 31.23],
  // Americas
  [-74.006, 40.71], [-43.17, -22.91], [-99.13, 19.43], [-77.04, -12.05],
  [-118.24, 34.05], [-87.63, 41.88], [-46.63, -23.55],
];

const TEXTURE_URLS = {
  day: "https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg",
  night: "https://unpkg.com/three-globe@2.41.12/example/img/earth-night.jpg",
  bump: "https://unpkg.com/three-globe@2.41.12/example/img/earth-topology.png",
  water: "https://unpkg.com/three-globe@2.41.12/example/img/earth-water.png",
};

// Convert lon/lat to 3D position on sphere
function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Hook to load textures with error handling ──
function useTextures() {
  const [textures, setTextures] = useState<{
    day: THREE.Texture | null;
    night: THREE.Texture | null;
    bump: THREE.Texture | null;
    water: THREE.Texture | null;
  }>({ day: null, night: null, bump: null, water: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    const keys = Object.keys(TEXTURE_URLS) as (keyof typeof TEXTURE_URLS)[];
    const results: Record<string, THREE.Texture | null> = {};
    let count = 0;

    keys.forEach((key) => {
      loader.load(
        TEXTURE_URLS[key],
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          results[key] = texture;
          count++;
          if (count === keys.length) {
            setTextures({
              day: results.day || null,
              night: results.night || null,
              bump: results.bump || null,
              water: results.water || null,
            });
            setLoaded(true);
          }
        },
        undefined,
        () => {
          results[key] = null;
          count++;
          if (count === keys.length) {
            setTextures({
              day: results.day || null,
              night: results.night || null,
              bump: results.bump || null,
              water: results.water || null,
            });
            setLoaded(true);
          }
        }
      );
    });

    return () => {
      Object.values(results).forEach((t) => t?.dispose());
    };
  }, []);

  return { textures, loaded };
}

// ── Atmosphere glow shell ──
function Atmosphere({ radius }: { radius: number }) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorldNormal;
        void main() {
          float rim = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          // Stronger glow on the sides and top
          float topBoost = smoothstep(-0.2, 0.8, vWorldNormal.y) * 0.5 + 0.5;
          vec3 color = mix(vec3(0.15, 0.4, 0.9), vec3(0.35, 0.65, 1.0), rim);
          float intensity = rim * 1.6 * topBoost;
          gl_FragColor = vec4(color, intensity);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh scale={[1.18, 1.18, 1.18]}>
      <sphereGeometry args={[radius, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ── Inner atmospheric rim ──
function InnerGlow({ radius }: { radius: number }) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          float intensity = pow(rim, 2.5);
          vec3 color = mix(vec3(0.3, 0.6, 1.0), vec3(0.5, 0.8, 1.0), rim);
          gl_FragColor = vec4(color, intensity * 0.6);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, []);

  return (
    <mesh scale={[1.005, 1.005, 1.005]}>
      <sphereGeometry args={[radius, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ── Location dot markers ──
function LocationDots({ radius, progress }: { radius: number; progress: number }) {
  const dotsData = useMemo(() => {
    return LOCATIONS.map(([lon, lat], i) => ({
      position: latLonToVec3(lat, lon, radius * 1.005),
      phase: 0.1 + (i / LOCATIONS.length) * 0.7,
    }));
  }, [radius]);

  return (
    <group>
      {dotsData.map((dot, i) => {
        if (progress < dot.phase) return null;
        const fadeIn = Math.min(1, (progress - dot.phase) / 0.15);
        const isRwanda = i === 0;
        return (
          <group key={i} position={dot.position}>
            <mesh>
              <ringGeometry args={[isRwanda ? 0.018 : 0.01, isRwanda ? 0.025 : 0.016, 32]} />
              <meshBasicMaterial
                color={isRwanda ? "#FF6B6B" : "#ffffff"}
                transparent
                opacity={fadeIn * 0.5}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <circleGeometry args={[isRwanda ? 0.012 : 0.007, 16]} />
              <meshBasicMaterial
                color={isRwanda ? "#FF6B6B" : "#ffffff"}
                transparent
                opacity={fadeIn * 0.9}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Main Earth globe with textures ──
function TexturedEarth({ scrollProgress, radius, textures }: {
  scrollProgress: number;
  radius: number;
  textures: { day: THREE.Texture | null; night: THREE.Texture | null; bump: THREE.Texture | null; water: THREE.Texture | null };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const earthMaterial = useMemo(() => {
    if (textures.day && textures.night && textures.bump) {
      return new THREE.ShaderMaterial({
        uniforms: {
          dayMap: { value: textures.day },
          nightMap: { value: textures.night },
          bumpMap: { value: textures.bump },
          lightDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D dayMap;
          uniform sampler2D nightMap;
          uniform sampler2D bumpMap;
          uniform vec3 lightDirection;
          varying vec2 vUv;
          varying vec3 vNormal;

          void main() {
            vec3 normal = normalize(vNormal);
            float NdotL = dot(normal, lightDirection);
            float dayFactor = smoothstep(-0.15, 0.25, NdotL);

            vec4 dayColor = texture2D(dayMap, vUv);
            vec4 nightColor = texture2D(nightMap, vUv);
            nightColor.rgb *= 1.8;
            dayColor.rgb += vec3(0.02, 0.04, 0.08) * dayFactor;

            vec3 color = mix(nightColor.rgb, dayColor.rgb, dayFactor);

            float specular = pow(max(dot(reflect(-lightDirection, normal), vec3(0.0, 0.0, 1.0)), 0.0), 20.0);
            float water = 1.0 - texture2D(bumpMap, vUv).r;
            color += vec3(0.3, 0.4, 0.5) * specular * water * 0.3;

            gl_FragColor = vec4(color, 1.0);
          }
        `,
      });
    }
    // Fallback: simple dark blue globe
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x0a2a5e),
      emissive: new THREE.Color(0x041230),
      shininess: 25,
    });
  }, [textures]);

  const cloudMaterial = useMemo(() => {
    if (textures.water) {
      return new THREE.MeshPhongMaterial({
        map: textures.water,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    }
    return null;
  }, [textures]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const p = Math.min(1, Math.max(0, scrollProgress));
    const targetRotationY = -1.6 + p * 1.0;
    const targetTiltX = 0.3 - p * 0.1;
    groupRef.current.rotation.y += (targetRotationY - groupRef.current.rotation.y) * 0.08;
    groupRef.current.rotation.x += (targetTiltX - groupRef.current.rotation.x) * 0.08;

    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 128, 128]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>

      {cloudMaterial && (
        <mesh ref={cloudRef} scale={[1.008, 1.008, 1.008]}>
          <sphereGeometry args={[radius, 64, 64]} />
          <primitive object={cloudMaterial} attach="material" />
        </mesh>
      )}

      <InnerGlow radius={radius} />
      <LocationDots radius={radius} progress={scrollProgress} />
    </group>
  );
}

// ── Scene — loads textures inside the Canvas context ──
function EarthScene({ scrollProgress }: { scrollProgress: number }) {
  const RADIUS = 2;
  const { textures, loaded } = useTextures();

  // Set dark background on the GL renderer
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor(new THREE.Color(0x083A85), 0);
  }, [gl]);

  if (!loaded) return null;

  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#4488ff" />

      <TexturedEarth scrollProgress={scrollProgress} radius={RADIUS} textures={textures} />
      <Atmosphere radius={RADIUS} />
    </>
  );
}

// ── Exported component ──
interface HalfEarthProps {
  width?: number;
  height?: number;
  tilt?: number;
  initialRotation?: number;
  scrollProgress?: number;
}

const HalfEarth: React.FC<HalfEarthProps> = ({
  height = 700,
  scrollProgress = 0,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  if (!mounted) {
    return (
      <div style={{ position: "relative", width: "100%", height, background: "transparent" }} />
    );
  }

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height,
      overflow: "hidden",
      background: "transparent",
    }}>

      {/* Atmospheric glow overlay at bottom edge */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: "-10%",
        right: "-10%",
        height: "40%",
        background: "radial-gradient(ellipse 120% 80% at 50% 100%, rgba(40,130,255,0.25) 0%, rgba(80,160,255,0.12) 30%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 3,
      }} />

      {/* Bright horizon glow line */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "linear-gradient(90deg, transparent 5%, rgba(100,180,255,0.5) 25%, rgba(180,220,255,0.7) 50%, rgba(100,180,255,0.5) 75%, transparent 95%)",
        zIndex: 4,
        filter: "blur(4px)",
      }} />

      <Canvas
        camera={{
          position: [0, -0.4, 4.8],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{
          position: "absolute",
          inset: 0,
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <EarthScene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
};

export default HalfEarth;
