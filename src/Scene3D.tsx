import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

function Sculpture() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (!meshRef.current) return

    meshRef.current.rotation.x += delta * 0.15
    meshRef.current.rotation.y += delta * 0.25

    meshRef.current.rotation.y +=
      (state.pointer.x * 0.3 - meshRef.current.rotation.y) * 0.01
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2, 3]} />
      <meshStandardMaterial
        color="#bcbcbc"
        metalness={0.9}
        roughness={0.15}
        flatShading
      />
    </mesh>
  )
}

export default function Scene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={3} />
      <pointLight position={[-5, -3, 3]} intensity={30} />

      <Sculpture />
    </Canvas>
  )
}