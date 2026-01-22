'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedSphere() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={2.2}>
                <MeshDistortMaterial
                    color="#a855f7"
                    attach="material"
                    distort={0.4}
                    speed={1.5}
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

export function Brain3D() {
    return (
        <div className="w-full h-full">
            <Canvas
                camera={{ position: [0, 0, 6], fov: 45 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color="#d8b4fe" />

                <AnimatedSphere />
                <InnerSphere />
                <FloatingParticles />

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
