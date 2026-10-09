import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { ExtrudeGeometry, Path, Shape } from 'three'
import type { Mesh } from 'three'

function roundedContour<T extends Shape | Path>(path: T, x: number, y: number, w: number, h: number, r: number): T {
  path.moveTo(x + r, y)
  path.lineTo(x + w - r, y)
  path.quadraticCurveTo(x + w, y, x + w, y + r)
  path.lineTo(x + w, y + h - r)
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  path.lineTo(x + r, y + h)
  path.quadraticCurveTo(x, y + h, x, y + h - r)
  path.lineTo(x, y + r)
  path.quadraticCurveTo(x, y, x + r, y)
  return path
}

function letterShape(letter: string) {
  const shape = new Shape()
  if (letter === 'O') {
    roundedContour(shape, 0, 0, 1.03, 1.3, 0.28)
    shape.holes.push(roundedContour(new Path(), 0.27, 0.26, 0.49, 0.78, 0.16))
  } else if (letter === 'P' || letter === 'R') {
    shape.moveTo(0, 0)
    shape.lineTo(0.27, 0)
    shape.lineTo(0.27, 0.5)
    if (letter === 'R') {
      shape.lineTo(0.47, 0.5)
      shape.lineTo(0.79, 0)
      shape.lineTo(1.1, 0)
      shape.lineTo(0.72, 0.56)
    } else shape.lineTo(0.64, 0.5)
    shape.bezierCurveTo(0.91, 0.5, 1.02, 0.66, 1.02, 0.9)
    shape.bezierCurveTo(1.02, 1.16, 0.88, 1.3, 0.64, 1.3)
    shape.lineTo(0, 1.3)
    shape.closePath()
    shape.holes.push(roundedContour(new Path(), 0.27, 0.75, 0.47, 0.3, 0.1))
  } else {
    const points = letter === 'X'
      ? [[0, 0], [0.31, 0], [0.55, 0.42], [0.79, 0], [1.1, 0], [0.71, 0.65], [1.1, 1.3], [0.79, 1.3], [0.55, 0.87], [0.31, 1.3], [0, 1.3], [0.39, 0.65]]
      : [[0.39, 0], [0.66, 0], [0.66, 0.52], [1.06, 1.3], [0.76, 1.3], [0.525, 0.81], [0.29, 1.3], [0, 1.3], [0.39, 0.52]]
    points.forEach(([x, y], i) => i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y))
    shape.closePath()
  }
  return shape
}

export default function ChromeWordmark({ reduced, progress }: { reduced: boolean; progress: { current: number } }) {
  const meshes = useRef<(Mesh | null)[]>([])
  const letters = useMemo(() => {
    let cursor = 0
    const result = [...'PROXXY'].map((letter) => {
      const geometry = new ExtrudeGeometry(letterShape(letter), {
        depth: 0.24, bevelEnabled: true, bevelThickness: 0.065,
        bevelSize: 0.055, bevelSegments: 5, curveSegments: 24,
      })
      geometry.computeBoundingBox()
      const width = geometry.boundingBox!.max.x - geometry.boundingBox!.min.x
      const center = cursor + width / 2
      cursor += width + 0.12
      geometry.center()
      return { geometry, center }
    })
    const total = cursor - 0.12
    return { forms: result.map((form) => ({ ...form, center: form.center - total / 2 })), total }
  }, [])
  useEffect(() => () => letters.forms.forEach(({ geometry }) => geometry.dispose()), [letters])

  useFrame(({ clock, pointer, size }, delta) => {
    const viewHeight = 2 * Math.tan(25 * Math.PI / 180) * 7.4
    const viewWidth = viewHeight * size.width / size.height
    const scale = Math.min(viewWidth * 0.66, 11) / letters.total
    const t = reduced ? 0 : clock.elapsedTime
    const follow = reduced ? 1 : 1 - Math.exp(-delta * 5)
    const p = progress.current
    meshes.current.forEach((mesh, i) => {
      if (!mesh) return
      const center = letters.forms[i].center * scale
      const dx = pointer.x * viewWidth / 2 - center
      const dy = pointer.y * viewHeight / 2
      const influence = reduced ? 0 : Math.exp(-(dx * dx + dy * dy) / 4)
      const outward = Math.sign(center) * p * p * viewWidth * 0.45
      mesh.position.x += (center + outward - dx * influence * 0.07 - mesh.position.x) * follow
      mesh.position.y += (Math.sin(t * 0.55 + i * 0.7) * 0.035 - dy * influence * 0.08 - mesh.position.y) * follow
      mesh.position.z += (1.25 + Math.sin(t * 0.4 + i) * 0.06 - p * 1.5 - mesh.position.z) * follow
      mesh.rotation.x += (dy * influence * 0.08 - mesh.rotation.x) * follow
      mesh.rotation.y += (dx * influence * 0.12 + Math.sign(center) * p * 0.45 - mesh.rotation.y) * follow
      mesh.rotation.z = Math.sin(t * 0.3 + i * 0.6) * 0.012
      mesh.scale.setScalar(scale)
    })
  })

  return <group>
    {letters.forms.map(({ geometry }, i) => (
      <mesh key={i} geometry={geometry} ref={(node) => { meshes.current[i] = node }}
        renderOrder={100 + i}
        onBeforeRender={i === 0 ? (renderer) => renderer.clearDepth() : undefined}>
        {/* Render the wordmark after the liquid, preserving the letters' own
            depth and shading while keeping foreground blobs from hiding it. */}
        <meshPhysicalMaterial color="#e2e7eb" metalness={1} roughness={0.15} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
    ))}
  </group>
}
