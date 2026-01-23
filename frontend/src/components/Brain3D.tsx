'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

function AnimatedSphere() {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime * (active ? 0.8 : 0.2);
            meshRef.current.rotation.y = state.clock.elapsedTime * (active ? 1.2 : 0.3);
            const s = hovered ? 1.1 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(s, s, s).multiplyScalar(2.2), 0.1);
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <Sphere
                ref={meshRef}
                args={[1.5, 64, 64]}
                scale={2.2}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={() => setActive(!active)}
            >
                <MeshDistortMaterial
                    color={active ? "#ec4899" : "#a855f7"}
                    attach="material"
                    distort={active ? 0.8 : 0.4}
                    speed={active ? 3 : 1.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>
        </Float>
    );
}

function FloatingParticles() {
    const particlesRef = useRef<THREE.Points>(null);
    const particleCount = 100;

    // Create geometry imperatively using useMemo to avoid bufferAttribute JSX type issues
    const geometry = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, []);

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    return (
        <points ref={particlesRef} geometry={geometry}>
            <pointsMaterial
                size={0.05}
                color="#d8b4fe"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

function InnerSphere() {
    return (
        <Float speed={3} rotationIntensity={0.3} floatIntensity={0.5}>
            <Sphere args={[0.8, 32, 32]} position={[0, 0, 0]} scale={1.5}>
                <meshStandardMaterial
                    color="#e879f9"
                    transparent
                    opacity={0.3}
                    wireframe
                />
            </Sphere>
        </Float>
    );
}

function FloatingLabel({ position, text, onClick }: { position: [number, number, number], text: string, onClick: () => void }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Html position={position} center distanceFactor={10}>
            <button
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-300 whitespace-nowrap",
                    hovered
                        ? "bg-purple-600 border-purple-400 text-white scale-110 shadow-lg glow-purple"
                        : "bg-slate-900/80 border-purple-500/30 text-purple-300 backdrop-blur-md"
                )}
            >
                {text}
            </button>
        </Html>
    );
}

function TagCloud({ tags, onTagClick }: { tags: string[], onTagClick: (tag: string) => void }) {
    const tagPositions = useMemo(() => {
        return tags.map((_, i) => {
            const phi = Math.acos(-1 + (2 * i) / tags.length);
            const theta = Math.sqrt(tags.length * Math.PI) * phi;
            const r = 4.5;
            return [
                r * Math.cos(theta) * Math.sin(phi),
                r * Math.sin(theta) * Math.sin(phi),
                r * Math.cos(phi)
            ] as [number, number, number];
        });
    }, [tags]);

    return (
        <group>
            {tags.map((tag, i) => (
                <FloatingLabel
                    key={tag}
                    position={tagPositions[i]}
                    text={tag}
                    onClick={() => onTagClick(tag)}
                />
            ))}
        </group>
    );
}

interface Brain3DProps {
    tags?: string[];
    onTagClick?: (tag: string) => void;
}

export function Brain3D({ tags = [], onTagClick = () => { } }: Brain3DProps) {
    const topTags = useMemo(() => tags.slice(0, 8), [tags]);

    return (
        <div className="w-full h-full">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color="#d8b4fe" />

                <AnimatedSphere />
                <InnerSphere />
                <FloatingParticles />
                <TagCloud tags={topTags} onTagClick={onTagClick} />

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={Math.PI / 2}
                />
            </Canvas>
        </div>
    );
}
