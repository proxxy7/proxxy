import useCameraMirror from './useCameraMirror'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BackSide, MeshPhysicalMaterial, Plane, Raycaster, Vector2, Vector3, SphereGeometry, TorusGeometry, TorusKnotGeometry } from 'three'
import type { Mesh } from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'

type WaterInput = { x: number; y: number; active: boolean; dragging: boolean; grab: number; release: number }
type ThrownPiece = { position: Vector3; velocity: Vector3; held: boolean; age: number;
  strength: number; source: number; merging: number; target: Vector3 | null }
type BlobField = { position: Vector3; source: number; strength: number; natural?: number }
type SculptureProps = { reduced: boolean; scatter: { current: number } }

function Sculpture({ reduced, scatter, water }: SculptureProps & { water: { current: WaterInput } }) {
  const fluidState = useRef({
    ray: new Raycaster(), pointer: new Vector2(), plane: new Plane(new Vector3(0, 0, 1), 0),
    hit: new Vector3(), targetHit: new Vector3(), previous: new Vector3(), velocity: new Vector3(),
    fields: [] as BlobField[], naturalTaken: new Set<number>(),
    lastGrab: 0, lastRelease: 0, pieces: [] as ThrownPiece[], mass: new Float32Array(36),
    active: false, influence: 0, pressure: 0.54, wakes: [] as { x: number; y: number; vx: number; vy: number; age: number; force: number }[],
  })
  const spread = useRef(0)
  const liveSurface = useRef<MarchingCubes>(null)
  const surface = useMemo(() => {
    const material = new MeshPhysicalMaterial({
      color: '#d5dade', metalness: 1, roughness: 0.095,
      clearcoat: 1, clearcoatRoughness: 0.08,
    })
    const mesh = new MarchingCubes(64, material, false, false, 36000)
    mesh.scale.set(4.6, 3.9, 4.0)
    mesh.isolation = 80
    mesh.frustumCulled = false
    return mesh
  }, [])

  useEffect(() => () => {
    surface.geometry.dispose()
    const material = surface.material as MeshPhysicalMaterial
    material.dispose()
  }, [surface])

  useFrame(({ clock, camera }, delta) => {
    const mesh = liveSurface.current
    if (!mesh) return
    const fluid = fluidState.current
    const t = reduced ? 0 : clock.elapsedTime
    const lead = Math.min(1, scatter.current / 0.4)
    const target = lead * lead * (3 - 2 * lead)
    spread.current += (target - spread.current) * (reduced ? 1 : 1 - Math.exp(-delta * 6))
    const opening = spread.current
    mesh.scale.set(4.6 * (1 + opening * 0.65), 3.9 * (1 + opening * 0.55), 4 * (1 + opening * 0.15))
    mesh.position.z = -opening * 0.7
    mesh.reset()
    const input = water.current
    fluid.pointer.set(input.x, input.y)
    fluid.ray.setFromCamera(fluid.pointer, camera)
    const released = input.release !== fluid.lastRelease
    fluid.lastRelease = input.release
    if (input.grab !== fluid.lastGrab) {
      fluid.lastGrab = input.grab
      mesh.updateMatrixWorld()
      mesh.geometry.computeBoundingSphere()
      const picked = fluid.ray.intersectObject(mesh, false)[0]
      if (picked) {
        const position = mesh.worldToLocal(picked.point.clone()).multiplyScalar(3.4)
        const existing = fluid.pieces.filter((piece) => !piece.held && piece.merging < 1)
          .sort((a, b) => a.position.distanceToSquared(position) - b.position.distanceToSquared(position))[0]
        const field = fluid.fields.filter((candidate) => candidate.strength > 0.03)
          .sort((a, b) => a.position.distanceToSquared(position) - b.position.distanceToSquared(position))[0]
        if (existing && (!field || existing.position.distanceTo(position) < field.position.distanceTo(position) + 0.12)) {
          // Grab the existing droplet itself, including one already merging.
          existing.strength *= 1 - existing.merging
          existing.merging = 0
          existing.target = null
          existing.held = true
          existing.age = 0
          existing.velocity.set(0, 0, 0)
        } else if (field && fluid.pieces.length < 10) {
          let strength = 0
          if (field.natural !== undefined) {
            // Remove all lobes of this procedural droplet from the source field.
            fluid.naturalTaken.add(field.natural)
            strength = fluid.fields.filter((candidate) => candidate.natural === field.natural)
              .reduce((total, candidate) => total + candidate.strength, 0)
          } else {
            // Transfer actual field mass out of the grabbed patch, including
            // neighboring contributors that would otherwise leave a duplicate.
            for (const offset of [-1, 0, 1]) {
              const index = (field.source + offset + 36) % 36
              const available = Math.max(0, 0.56 + fluid.mass[index])
              const taken = available * (offset === 0 ? 1 : 0.28)
              fluid.mass[index] -= taken
              strength += taken
            }
          }
          if (strength > 0.03) fluid.pieces.push({
            position: field.position.clone(), velocity: new Vector3(), held: true,
            age: 0, strength, source: field.source, merging: 0, target: null,
          })
        }
      }
    }
    const hit = input.active && fluid.ray.ray.intersectPlane(fluid.plane, fluid.targetHit)
    if (hit) {
      mesh.updateMatrixWorld()
      mesh.worldToLocal(fluid.targetHit).multiplyScalar(3.4)
      if (!fluid.active) {
        fluid.hit.copy(fluid.targetHit)
        fluid.previous.copy(fluid.hit)
      }
      fluid.hit.lerp(fluid.targetHit, 1 - Math.exp(-delta * 10))
      fluid.velocity.copy(fluid.hit).sub(fluid.previous)
      if (fluid.velocity.length() > 0.015) {
        fluid.wakes.push({ x: fluid.hit.x, y: fluid.hit.y, vx: fluid.velocity.x, vy: fluid.velocity.y, age: 0,
          force: Math.min(1, fluid.velocity.length() * 7) * (input.dragging ? 1.5 : 1) })
        if (fluid.wakes.length > 24) fluid.wakes.shift()
      }
      fluid.previous.copy(fluid.hit)
    }
    fluid.active = Boolean(hit)
    const flowFollow = 1 - Math.exp(-delta * 5)
    fluid.influence += ((fluid.active ? 1 : 0) - fluid.influence) * flowFollow
    fluid.pressure += ((input.dragging ? 0.78 : 0.54) - fluid.pressure) * flowFollow
    for (const wake of fluid.wakes) wake.age += delta
    fluid.wakes = fluid.wakes.filter((wake) => wake.age < 3.5)
    const displace = (x: number, y: number, z: number) => {
      if (fluid.influence > 0.001) {
        const dx = x - fluid.hit.x, dy = y - fluid.hit.y
        const distance = Math.hypot(dx, dy)
        const force = Math.exp(-distance * distance / 1.35) * fluid.pressure * fluid.influence * (1 - opening * 0.65)
        x += dx / Math.max(distance, 0.1) * force
        y += dy / Math.max(distance, 0.1) * force
        z -= force * 0.7
      }
      for (const wake of fluid.wakes) {
        const dx = x - wake.x, dy = y - wake.y
        const distance = Math.hypot(dx, dy)
        // A viscous wake spreads and fades without an oscillating rebound.
        const diffusion = 0.65 + wake.age * 0.35
        const flow = Math.exp(-distance * distance / diffusion - wake.age * 1.25) * wake.force
        x += wake.vx * flow * 1.4 + dx * flow * 0.065
        y += wake.vy * flow * 1.4 + dy * flow * 0.065
        z -= flow * 0.055

      }
      return { x: Math.max(-2.85, Math.min(2.85, x)),
        y: Math.max(-2.85, Math.min(2.85, y)), z: Math.max(-2.85, Math.min(2.85, z)) }
    }
    // Closely overlapping fields make a continuous liquid body around an open center.
    const point = (index: number) => {
      const u = index / 36
      const angle = u * Math.PI * 4 + t * 0.12
      const radius = 0.64 * (2.15 + Math.cos(3 * angle / 2))
      const expansion = 1 + opening * 0.12
      return {
        x: expansion * radius * Math.cos(angle) + Math.sin(t * 0.31 + index * 0.8) * 0.1,
        y: expansion * radius * Math.sin(angle) + Math.sin(t * 0.32 + u * Math.PI * 6) * 0.16,
        z: expansion * 1.1 * Math.sin(3 * angle / 2) + Math.cos(t * 0.4 + index * 0.6) * 0.22,
      }
    }
    const step = Math.min(delta, 0.04)
    const colliders: BlobField[] = []
    for (const piece of fluid.pieces) {
      piece.age += step
      if (piece.held && fluid.active && input.dragging) {
        const previous = piece.position.clone()
        const desired = new Vector3(fluid.targetHit.x, fluid.targetHit.y, piece.position.z)
        desired.clampScalar(-2.75, 2.75)
        piece.position.lerp(desired, 1 - Math.exp(-step * 14))
        const speed = piece.position.clone().sub(previous).divideScalar(Math.max(step, 0.001))
        speed.clampLength(0, 5)
        piece.velocity.lerp(speed, 1 - Math.exp(-step * 18))
      }
      if (piece.held && (released || !input.dragging)) piece.held = false
      if (!piece.held && !piece.target) {
        piece.velocity.multiplyScalar(Math.exp(-step * 0.65))
        piece.position.addScaledVector(piece.velocity, step)
        // Soft containment keeps thrown liquid in the visible sculpture space.
        for (const axis of ['x', 'y', 'z'] as const) {
          if (Math.abs(piece.position[axis]) > 2.65) {
            piece.velocity[axis] -= Math.sign(piece.position[axis]) * step * 5
            piece.position[axis] = Math.max(-2.85, Math.min(2.85, piece.position[axis]))
          }
        }
      }
    }
    for (let i = 0; i < 36; i++) {
      const u = i / 36
      const rest = point(i)
      const p = displace(rest.x, rest.y, rest.z)
      const swell = 0.46 + (0.5 + 0.5 * Math.sin(t * 0.24 - u * Math.PI * 4)) * 0.1
      const strength = Math.max(0, swell + fluid.mass[i]) * (1 - opening * 0.42)
      if (strength > 0.01) {
        colliders.push({ position: new Vector3(p.x, p.y, p.z), source: i, strength })
        mesh.addBall(0.5 + p.x / 6.8, 0.5 + p.y / 6.8, 0.5 + p.z / 6.8, strength, 12)
      }
    }
    // Lobes follow their attachment point while moving smoothly outward and
    // back. The shared field forms a thinning neck, pinches off, then reunites.
    for (let i = 0; i < 3; i++) {
      if (fluid.naturalTaken.has(i)) continue
      const anchor = point(Math.floor(i * 36 / 3))
      const phase = t * (0.24 + i * 0.013) + i * 1.9
      const excursion = Math.pow((1 - Math.cos(phase)) / 2, 2)
      const length = Math.hypot(anchor.x, anchor.y, anchor.z)
      const distance = excursion * (0.46 - opening * 0.1)
      const x = anchor.x + anchor.x / length * distance
      const y = anchor.y + anchor.y / length * distance + Math.sin(phase) * excursion * 0.12
      const z = anchor.z + anchor.z / length * distance
      // An asymmetric cluster makes each droplet a deforming teardrop or
      // bent lobe. It shares one smooth surface and keeps a heavier end.
      const yaw = i * 1.7 + Math.sin(t * 0.28 + i) * 0.7
      const pitch = Math.sin(t * 0.32 + i * 1.4) * 0.65
      const stretch = 0.15 + excursion * (0.16 + 0.1 * Math.sin(t * 0.48 + i))
      for (let lobe = -1; lobe <= 1; lobe++) {
        const offset = lobe * stretch
        const bend = Math.abs(lobe) * Math.sin(t * 0.5 + i) * 0.11 * excursion
        const dx = Math.cos(yaw) * Math.cos(pitch) * offset
        const dy = Math.sin(pitch) * offset + bend
        const dz = Math.sin(yaw) * Math.cos(pitch) * offset
        const strength = (lobe === 0 ? 0.25 : lobe === -1 ? 0.16 : 0.11) *
          (1 + Math.sin(t * 0.42 + i * 1.8) * 0.1)
        const p = displace(x + dx, y + dy, z + dz)
        colliders.push({ position: new Vector3(p.x, p.y, p.z), source: Math.floor(i * 36 / 3), strength, natural: i })
        mesh.addBall(0.5 + p.x / 6.8, 0.5 + p.y / 6.8, 0.5 + p.z / 6.8, strength, 12)
      }
    }
    for (const piece of fluid.pieces) {
      if (!piece.held && piece.age > 0.3 && !piece.target) {
        const contact = colliders.find((blob) => piece.position.distanceTo(blob.position) < 0.5)
        if (contact) {
          piece.target = contact.position
          piece.source = contact.source
        }
        // Thrown droplets can also coalesce with each other.
        const other = fluid.pieces.find((candidate) => candidate !== piece &&
          !candidate.held && !candidate.target && candidate.merging === 0 && candidate.position.distanceTo(piece.position) < 0.42)
        if (!piece.target && other) {
          other.strength += piece.strength
          piece.merging = 1
        }
      }
      if (piece.target) {
        const p = point(piece.source)
        piece.target.set(p.x, p.y, p.z)
        piece.position.lerp(piece.target, 1 - Math.exp(-step * 8))
        piece.merging = Math.min(1, piece.merging + step * 2.5)
        if (piece.merging >= 1) fluid.mass[piece.source] += piece.strength
      }
      if (piece.merging < 1) {
        const p = piece.position
        const stretch = Math.min(0.16, piece.velocity.length() * 0.035)
        const direction = piece.velocity.clone().normalize()
        for (const offset of [-1, 0, 1]) {
          const shape = p.clone().addScaledVector(direction, offset * stretch)
          const strength = piece.strength * (offset === 0 ? 0.6 : 0.2) * (1 - piece.merging)
          mesh.addBall(0.5 + shape.x / 6.8, 0.5 + shape.y / 6.8, 0.5 + shape.z / 6.8, strength, 12)
        }
      }
    }
    fluid.fields = colliders
    fluid.pieces = fluid.pieces.filter((piece) => piece.merging < 1)
    mesh.update()
    mesh.rotation.y = Math.sin(t * 0.15) * 0.35
    mesh.rotation.z = -0.35 + Math.sin(t * 0.18) * 0.08
  })

  return <primitive ref={liveSurface} object={surface} dispose={null} />
}

function SurroundingSculptures({ reduced, scatter }: SculptureProps) {
  const spread = useRef(0)
  const forms = useRef<(Mesh | null)[]>([])
  const geometries = useMemo(() => {
    const shapes = [
      new TorusGeometry(0.52, 0.23, 24, 72),
      new SphereGeometry(0.62, 40, 28),
      new TorusKnotGeometry(0.36, 0.17, 112, 20, 2, 3),
      new SphereGeometry(0.48, 40, 28),
    ]
    shapes.forEach((geometry, index) => {
      const positions = geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
        const swell = 1 + Math.sin(x * 5 + index) * Math.cos(y * 4 - z * 3) * 0.16
        positions.setXYZ(i, x * swell, y * swell, z * swell)
      }
      if (index === 1) geometry.scale(1.35, 0.75, 1)
      if (index === 3) geometry.scale(0.8, 1.45, 1.1)
      geometry.computeVertexNormals()
    })
    return shapes
  }, [])
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries])

  useFrame(({ clock, size }, delta) => {
    const viewHeight = 2 * Math.tan(25 * Math.PI / 180) * 7.4
    const viewWidth = viewHeight * size.width / size.height
    const lead = Math.min(1, scatter.current / 0.4)
    const target = lead * lead * (3 - 2 * lead)
    spread.current += (target - spread.current) * (reduced ? 1 : 1 - Math.exp(-delta * 6))
    const opening = spread.current
    const t = reduced ? 0 : clock.elapsedTime
    const anchors = [[-0.36, 0.29], [0.36, -0.28], [-0.32, -0.3], [0.33, 0.31]]
    forms.current.forEach((mesh, i) => {
      if (!mesh) return
      const [x, y] = anchors[i]
      // Relative placement keeps the accents around the lettering on every screen.
      mesh.position.set(x * viewWidth * (1 + opening * 0.17) + Math.sin(t * 0.23 + i) * 0.12,
        y * viewHeight * (1 + opening * 0.24) + Math.sin(t * 0.3 + i * 1.7) * 0.14,
        -0.45 + Math.sin(t * 0.19 + i * 2) * 0.35 + opening * (i % 2 ? 0.8 : -0.8))
      const responsive = Math.min(1, viewWidth / 7)
      const breath = responsive * (1 + Math.sin(t * 0.6 + i) * 0.065)
      mesh.scale.setScalar(breath)
      mesh.rotation.set(0.35 + Math.sin(t * 0.21 + i) * 0.25, t * (i % 2 ? -0.1 : 0.08) + i, -0.4 + i * 0.6)
    })
  })

  return <group>
    {geometries.map((geometry, i) => (
      <mesh key={i} geometry={geometry} ref={(mesh) => { forms.current[i] = mesh }}>
        <meshPhysicalMaterial color="#d5dade" metalness={1} roughness={0.11} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
    ))}
  </group>
}

function FlyThroughCamera({ reduced, scatter }: SculptureProps) {
  const progress = useRef(0)
  useFrame(({ camera, pointer }, delta) => {
    const follow = reduced ? 1 : 1 - Math.exp(-delta * 2.4)
    progress.current += (scatter.current - progress.current) * follow
    // Give the liquid a head start, then ease the passage at both ends.
    const p = Math.max(0, (progress.current - 0.08) / 0.92)
    const eased = p * p * p * (p * (p * 6 - 15) + 10)
    camera.position.z = 7.4 - eased * 12.4
    camera.position.x += ((reduced ? 0 : pointer.x * 0.18) - camera.position.x) * follow
    camera.position.y += ((reduced ? 0 : pointer.y * 0.12) - camera.position.y) * follow
    // Keep looking forward as the camera crosses the center; looking at the
    // origin would flip the view once the camera passed through it.
    camera.lookAt(camera.position.x, camera.position.y, camera.position.z - 1)
  })
  return null
}

export default function Proxxy3D() {
  const mirror = useCameraMirror()
  const [reduced, setReduced] = useState(false)
  const scatter = useRef(0)
  const water = useRef<WaterInput>({ x: 0, y: 0, active: false, dragging: false, grab: 0, release: 0 })
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('.hero-stage')
    if (!stage) return
    const move = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('.camera-mirror-controls')) return
      const bounds = stage.getBoundingClientRect()
      water.current.x = (event.clientX - bounds.left) / bounds.width * 2 - 1
      water.current.y = 1 - (event.clientY - bounds.top) / bounds.height * 2
      water.current.active = true
    }
    const down = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('.camera-mirror-controls')) return
      if (event.button !== 0) return
      move(event)
      water.current.dragging = true
      water.current.grab += 1
      stage.setPointerCapture(event.pointerId)
      stage.style.cursor = 'grabbing'
    }
    const up = (event: PointerEvent) => {
      water.current.dragging = false
      water.current.release += 1
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId)
      stage.style.cursor = 'grab'
    }
    const leave = () => { if (!water.current.dragging) water.current.active = false }
    const cancel = (event: PointerEvent) => { up(event); water.current.active = false }
    stage.style.cursor = 'grab'
    stage.addEventListener('pointermove', move)
    stage.addEventListener('pointerdown', down)
    stage.addEventListener('pointerup', up)
    stage.addEventListener('pointercancel', cancel)
    stage.addEventListener('lostpointercapture', cancel)
    stage.addEventListener('pointerleave', leave)
    return () => {
      stage.removeEventListener('pointermove', move)
      stage.removeEventListener('pointerdown', down)
      stage.removeEventListener('pointerup', up)
      stage.removeEventListener('pointercancel', cancel)
      stage.removeEventListener('lostpointercapture', cancel)
      stage.removeEventListener('pointerleave', leave)
      stage.style.cursor = ''
    }
  }, [])
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('.hero-journey')
    if (!stage) return
    const update = () => {
      const bounds = stage.getBoundingClientRect()
      const distance = Math.max(1, bounds.height - window.innerHeight)
      scatter.current = Math.max(0, Math.min(1, -bounds.top / distance))
      stage.style.setProperty('--journey-progress', String(scatter.current))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return (
    <>
    <Canvas onCreated={({ gl }) => { gl.localClippingEnabled = true }} camera={{ position: [0, 0, 7.4], fov: 50, near: 0.035, far: 100 }} dpr={1} aria-label="A liquid chrome sculpture surrounded by four floating chrome forms around the PROXXY lettering">
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 3]} intensity={3} />
      <pointLight position={[-3, -1, 2]} intensity={8} color="#ffffff" />
      {mirror.texture ? (
        <Environment frames={Infinity} resolution={256}>
          <mesh>
            <boxGeometry args={[20, 20, 20]} />
            <meshBasicMaterial map={mirror.texture} side={BackSide} toneMapped={false} />
          </mesh>
        </Environment>
      ) : <Environment preset="city" />}
      <Sculpture reduced={reduced} scatter={scatter} water={water} />
      <SurroundingSculptures reduced={reduced} scatter={scatter} />
      <FlyThroughCamera reduced={reduced} scatter={scatter} />
    </Canvas>
    <div className="camera-mirror-controls">
      <button type="button" disabled={mirror.pending} aria-pressed={Boolean(mirror.texture)}
        onClick={mirror.texture ? mirror.disable : () => { void mirror.enable() }}>
        {mirror.pending ? 'STARTING CAMERA…' : mirror.texture ? 'TURN MIRROR OFF ↗' : 'CAMERA MIRROR ↗'}
      </button>
      <span>{mirror.texture ? 'LIVE / CAMERA STAYS ON YOUR DEVICE' : 'REFLECT YOURSELF IN THE CHROME'}</span>
      {mirror.error && <p role="status">{mirror.error}</p>}
    </div>
    </>
  )
}
