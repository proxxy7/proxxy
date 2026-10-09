import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BoxGeometry, BufferGeometry, DataTexture, EdgesGeometry, ExtrudeGeometry, Float32BufferAttribute, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, SRGBColorSpace, Path, Plane, Shape, ShapeGeometry, TorusGeometry, Vector3 } from 'three'
import type { Group, Mesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

function cutCornerContour<T extends Shape | Path>(path: T, x: number, y: number, w: number, h: number, r: number): T {
  path.moveTo(x + r, y)
  path.lineTo(x + w - r, y)
  path.lineTo(x + w, y + r)
  path.lineTo(x + w, y + h - r)
  path.lineTo(x + w - r, y + h)
  path.lineTo(x + r, y + h)
  path.lineTo(x, y + h - r)
  path.lineTo(x, y + r)
  path.lineTo(x + r, y)
  return path
}

function letterShape(letter: string) {
  const shape = new Shape()
  if (letter === 'O') {
    cutCornerContour(shape, 0, 0, 1.03, 1.3, 0.17)
    shape.holes.push(cutCornerContour(new Path(), 0.27, 0.26, 0.49, 0.78, 0.07))
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
    shape.lineTo(0.83, 0.5)
    shape.lineTo(1.02, 0.68)
    shape.lineTo(1.02, 1.12)
    shape.lineTo(0.83, 1.3)
    shape.lineTo(0, 1.3)
    shape.closePath()
    shape.holes.push(cutCornerContour(new Path(), 0.27, 0.75, 0.47, 0.3, 0.045))
  } else {
    const points = letter === 'X'
      ? [[0, 0], [0.31, 0], [0.55, 0.42], [0.79, 0], [1.1, 0], [0.71, 0.65], [1.1, 1.3], [0.79, 1.3], [0.55, 0.87], [0.31, 1.3], [0, 1.3], [0.39, 0.65]]
      : [[0.39, 0], [0.66, 0], [0.66, 0.52], [1.06, 1.3], [0.76, 1.3], [0.525, 0.81], [0.29, 1.3], [0, 1.3], [0.39, 0.52]]
    points.forEach(([x, y], i) => i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y))
    shape.closePath()
  }
  return shape
}

function faceDetails(shape: Shape, center: Vector3) {
  const contours = shape.extractPoints(16)
  const inside = (x: number, y: number, polygon: { x: number; y: number }[]) => {
    let result = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j]
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) result = !result
    }
    return result
  }
  const safe = (x: number, y: number) => [[0, 0], [-0.03, 0], [0.03, 0], [0, -0.03], [0, 0.03]].every(([dx, dy]) =>
    inside(x + dx, y + dy, contours.shape) && !contours.holes.some((hole) => inside(x + dx, y + dy, hole)))
  const samples: [number, number][] = []
  const ticks: number[] = []
  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 7; column++) {
      const x = 0.11 + column * 0.145, y = 0.12 + row * 0.15
      if (!safe(x, y)) continue
      samples.push([x, y])
      const px = x * 0.88 - center.x, py = y * 1.08 - center.y
      if ((row + column) % 2 === 0) {
        const length = row % 3 === 0 ? 0.042 : 0.023
        ticks.push(px - length / 2, py, 0.108, px + length / 2, py, 0.108)
        ticks.push(px, py - 0.012, 0.108, px, py + 0.012, 0.108)
      }
    }
  }
  const marks = new BufferGeometry()
  marks.setAttribute('position', new Float32BufferAttribute(ticks, 3))
  const hardware: BufferGeometry[] = []
  const used = new Set<number>()
  for (const fraction of [0, 0.32, 0.68, 1]) {
    const index = Math.round((samples.length - 1) * fraction)
    if (used.has(index) || !samples[index]) continue
    used.add(index)
    const [x, y] = samples[index]
    const px = x * 0.88 - center.x, py = y * 1.08 - center.y
    const ring = new TorusGeometry(0.014, 0.003, 6, 16)
    ring.translate(px, py, 0.111)
    const slot = new BoxGeometry(0.018, 0.0025, 0.003)
    slot.rotateZ(Math.PI / 4)
    slot.translate(px, py, 0.112)
    hardware.push(ring, slot)
  }
  const fasteners = hardware.length ? mergeGeometries(hardware)! : new BufferGeometry()
  hardware.forEach((geometry) => geometry.dispose())
  return { marks, fasteners }
}

function machinedFinish() {
  const size = 256
  const color = new Uint8Array(size * size * 4)
  const relief = new Uint8Array(size * size * 4)
  const roughness = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size
      const grain = Math.sin(x * 78.233 + y * 12.9898) * 43758.5453
      const noise = grain - Math.floor(grain)
      // Flowing CNC contours cut across a darker, finely brushed alloy face.
      const phase = (u * 8 + Math.sin(v * Math.PI * 2) * 0.65 + Math.sin(u * Math.PI * 2 + v * Math.PI * 4) * 0.3) * Math.PI
      const groove = Math.pow(Math.max(0, 1 - Math.abs(Math.sin(phase)) * 9), 2)
      const glint = Math.pow(Math.max(0, 1 - Math.abs(Math.sin(phase + 0.18)) * 12), 2)
      const brushing = Math.sin(v * Math.PI * 2 * 96) * 0.035 + noise * 0.035
      const shade = Math.min(0.96, 0.82 + Math.sin((u + v) * Math.PI * 2) * 0.085 + brushing * 0.6 - groove * 0.19 + glint * 0.09)
      const i = (y * size + x) * 4
      color.set([shade * 228, shade * 240, shade * 250, 255], i)
      const height = Math.max(0, Math.min(255, 155 - groove * 45 + noise * 2.5))
      relief.set([height, height, height, 255], i)
      const rough = 135 + noise * 28 + groove * 55 - glint * 40
      roughness.set([rough, rough, rough, 255], i)
    }
  }
  const make = (data: Uint8Array) => {
    const texture = new DataTexture(data, size, size, RGBAFormat)
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.anisotropy = 4
    texture.generateMipmaps = true
    texture.minFilter = LinearMipmapLinearFilter
    texture.needsUpdate = true
    return texture
  }
  const map = make(color)
  map.colorSpace = SRGBColorSpace
  return { map, bump: make(relief), roughness: make(roughness) }
}

export default function ChromeWordmark({ reduced, progress }: { reduced: boolean; progress: { current: number } }) {
  const finish = useMemo(() => machinedFinish(), [])
  useEffect(() => () => Object.values(finish).forEach((texture) => texture.dispose()), [finish])
  const meshes = useRef<(Group | null)[]>([])
  const upperFaces = useRef<(Mesh | null)[]>([])
  const lowerFaces = useRef<(Mesh | null)[]>([])
  const letters = useMemo(() => {
    let cursor = 0
    const result = [...'PROXXY'].map((letter, index) => {
      const shape = letterShape(letter)
      const geometry = new ExtrudeGeometry(shape, {
        depth: 0.18, bevelEnabled: true, bevelThickness: 0.015,
        bevelSize: 0.012, bevelSegments: 2, curveSegments: 12,
      })
      const uv = geometry.getAttribute('uv')
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.1 + index * 0.17, uv.getY(i) / 1.3)
      geometry.scale(0.88, 1.08, 1)
      geometry.computeBoundingBox()
      const width = geometry.boundingBox!.max.x - geometry.boundingBox!.min.x
      const center = cursor + width / 2
      cursor += width + 0.18
      const origin = geometry.boundingBox!.getCenter(new Vector3())
      const details = faceDetails(shape, origin)
      // Faceplates are single planar surfaces. Duplicating the entire beveled
      // shell for each half caused coincident side surfaces and unstable edges.
      const face = new ShapeGeometry(shape, 24)
      const faceUV = face.getAttribute('uv')
      for (let i = 0; i < faceUV.count; i++) faceUV.setXY(i, faceUV.getX(i) / 1.1 + index * 0.17, faceUV.getY(i) / 1.3)
      face.scale(0.88, 1.08, 1)
      face.translate(-origin.x, -origin.y, 0.105)
      geometry.center()
      const edges = new EdgesGeometry(geometry, 35)
      const slope = letter === 'X' ? -0.2 : 0.14
      return { geometry, face, edges, ...details, center,
        upperPlane: new Plane(new Vector3(slope, 1, 0).normalize(), -0.018),
        lowerPlane: new Plane(new Vector3(-slope, -1, 0).normalize(), -0.018), slope }
    })
    const total = cursor - 0.18
    return { forms: result.map((form) => ({ ...form, center: form.center - total / 2 })), total }
  }, [])
  useEffect(() => () => letters.forms.forEach(({ geometry, face, edges, marks, fasteners }) => { geometry.dispose(); face.dispose(); edges.dispose(); marks.dispose(); fasteners.dispose() }), [letters])

  useFrame(({ pointer, size }, delta) => {
    const viewHeight = 2 * Math.tan(25 * Math.PI / 180) * 7.4
    const viewWidth = viewHeight * size.width / size.height
    const scale = Math.min(viewWidth * 0.66, 11) / letters.total
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
      mesh.position.y += (-dy * influence * 0.06 - mesh.position.y) * follow
      mesh.position.z += (1.25 - p * 1.5 - mesh.position.z) * follow
      mesh.rotation.x += (dy * influence * 0.08 - mesh.rotation.x) * follow
      mesh.rotation.y += (dx * influence * 0.085 + Math.sign(center) * p * 0.45 - mesh.rotation.y) * follow
      mesh.rotation.z = 0
      mesh.scale.setScalar(scale)
      const upper = upperFaces.current[i]
      const lower = lowerFaces.current[i]
      const separation = 0.014 + influence * 0.035
      if (upper && lower) {
        upper.position.y += (separation - upper.position.y) * follow
        lower.position.y += (-separation - lower.position.y) * follow
        upper.position.z += (0.028 + influence * 0.045 - upper.position.z) * follow
        lower.position.z += (0.028 - influence * 0.015 - lower.position.z) * follow
        upper.position.x += (influence * 0.018 - upper.position.x) * follow
        lower.position.x += (-influence * 0.018 - lower.position.x) * follow
        mesh.updateMatrixWorld(true)
        const form = letters.forms[i]
        form.upperPlane.set(new Vector3(form.slope, 1, 0).normalize(), -0.018).applyMatrix4(upper.matrixWorld)
        form.lowerPlane.set(new Vector3(-form.slope, -1, 0).normalize(), -0.018).applyMatrix4(lower.matrixWorld)
      }
    })
  })

  return <group>
    {letters.forms.map(({ geometry, face, edges, marks, fasteners, upperPlane, lowerPlane }, i) => (
      <group key={i} ref={(node) => { meshes.current[i] = node }}>
        {/* A dark continuous chassis sits behind two independently moving face
            plates. Depth resets once so liquid cannot cover the wordmark. */}
        <mesh geometry={geometry} position={[0, 0, -0.035]} renderOrder={100 + i * 4}
          onBeforeRender={i === 0 ? (renderer) => renderer.clearDepth() : undefined}>
          <meshPhysicalMaterial color="#303a43" metalness={0.85} roughness={0.32} />
          <lineSegments geometry={edges} renderOrder={102 + i * 4}>
            <lineBasicMaterial color="#c0ccd5" transparent opacity={0.25} depthWrite={false} />
          </lineSegments>
        </mesh>
        <mesh geometry={face} ref={(node) => { upperFaces.current[i] = node }} renderOrder={101 + i * 4}>
          <meshPhysicalMaterial color="#f0f3f2" emissive="#b9d3e5" emissiveIntensity={0.24} map={finish.map} bumpMap={finish.bump} bumpScale={0.004} roughnessMap={finish.roughness} metalness={0.5} roughness={0.7}
            clearcoat={0.25} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} clippingPlanes={[upperPlane]} />

          <mesh geometry={fasteners} renderOrder={102 + i * 4}>
            <meshPhysicalMaterial color="#35434d" metalness={0.9} roughness={0.26} clippingPlanes={[upperPlane]} />
          </mesh>
          <lineSegments geometry={marks} renderOrder={102 + i * 4}>
            <lineBasicMaterial color="#293a46" clippingPlanes={[upperPlane]} />
          </lineSegments>

        </mesh>
        <mesh geometry={face} ref={(node) => { lowerFaces.current[i] = node }} renderOrder={101 + i * 4}>
          <meshPhysicalMaterial color="#d4dee4" emissive="#a9c8e0" emissiveIntensity={0.2} map={finish.map} bumpMap={finish.bump} bumpScale={0.004} roughnessMap={finish.roughness} metalness={0.6} roughness={0.6}
            clearcoat={0.35} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} clippingPlanes={[lowerPlane]} />

          <mesh geometry={fasteners} renderOrder={102 + i * 4}>
            <meshPhysicalMaterial color="#35434d" metalness={0.9} roughness={0.26} clippingPlanes={[lowerPlane]} />
          </mesh>
          <lineSegments geometry={marks} renderOrder={102 + i * 4}>
            <lineBasicMaterial color="#293a46" clippingPlanes={[lowerPlane]} />
          </lineSegments>

        </mesh>
      </group>
    ))}
  </group>
}
