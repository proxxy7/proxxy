import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { useRef } from 'react'
import type { Mesh } from 'three'

function Sculpture() {
  const mesh = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.15
      mesh.current.rotation.y += delta * 0.25
    }
  })

  return (
    <mesh ref={mesh}>
      <torusKnotGeometry args={[1.2, 0.35, 180, 12, 2, 3]} />
      <meshPhysicalMaterial
        color="#ffffff"
         metalness={1}
        roughness={0.04}
        clearcoat={1}
        clearcoatRoughness={0.02}
    />
    </mesh>
  )
}

export default function Proxxy3D() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={3} />
      <pointLight position={[-5, -3, 2]} intensity={2} color="#8888ff" />

      <Environment preset="city" />

    <Sculpture />

    <OrbitControls enableDamping />
    </Canvas>
  )
}