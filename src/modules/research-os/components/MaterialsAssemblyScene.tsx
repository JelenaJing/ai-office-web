import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '../store/projectStore'

const THICKNESS_SCALE = 0.0032
const LAYER_GAP = 0.055

type MaterialVisualKind = 'metal' | 'active' | 'separator' | 'gel' | 'carbon' | 'binder' | 'case'

type ViewMode = '3d' | 'exploded' | 'cross-section' | 'stack'

function visualKind(materialId: string): MaterialVisualKind {
  if (materialId.includes('case')) return 'case'
  if (materialId.includes('foil')) return 'metal'
  if (materialId.includes('cathode')) return 'active'
  if (materialId === 'separator') return 'separator'
  if (materialId.includes('electrolyte')) return 'gel'
  if (materialId.includes('anode')) return 'carbon'
  return 'binder'
}

function materialParams(kind: MaterialVisualKind, selected: boolean) {
  if (kind === 'metal') return { metalness: 0.88, roughness: 0.2, transparent: false, opacity: 1, emissiveIntensity: selected ? 0.45 : 0.05 }
  if (kind === 'case') return { metalness: 0.35, roughness: 0.15, transparent: true, opacity: 0.35, emissiveIntensity: selected ? 0.35 : 0.05 }
  if (kind === 'separator') return { metalness: 0.02, roughness: 0.12, transparent: true, opacity: 0.55, emissiveIntensity: selected ? 0.5 : 0.1 }
  if (kind === 'gel') return { metalness: 0.05, roughness: 0.05, transparent: true, opacity: 0.78, emissiveIntensity: selected ? 0.65 : 0.2 }
  if (kind === 'carbon') return { metalness: 0.1, roughness: 0.9, transparent: false, opacity: 1, emissiveIntensity: selected ? 0.4 : 0.05 }
  if (kind === 'binder') return { metalness: 0.05, roughness: 0.36, transparent: true, opacity: 0.82, emissiveIntensity: selected ? 0.45 : 0.08 }
  return { metalness: 0.2, roughness: 0.45, transparent: false, opacity: 1, emissiveIntensity: selected ? 0.45 : 0.08 }
}

function seededPoints(seed: string, count: number, width: number, depth: number, y: number) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return Array.from({ length: count }, (_, idx) => {
    const a = Math.sin(hash + idx * 17.17) * 10000
    const b = Math.sin(hash + idx * 29.31) * 10000
    return {
      x: (a - Math.floor(a) - 0.5) * width,
      z: (b - Math.floor(b) - 0.5) * depth,
      y,
      r: 0.02 + ((idx % 4) * 0.005),
    }
  })
}

function CameraRig({ stackCenter, stackHeight, viewMode }: { stackCenter: number; stackHeight: number; viewMode: ViewMode }) {
  const camera = useThree(s => s.camera)
  const target = useRef(new THREE.Vector3(0, stackCenter, 0))

  useFrame(() => {
    target.current.set(0, stackCenter, 0)
    const dist = Math.max(3.2, stackHeight * 1.8 + 2.2)
    const desired =
      viewMode === 'stack'
        ? new THREE.Vector3(dist * 1.35, stackCenter, 0.15)
        : new THREE.Vector3(dist * 0.75, stackCenter + dist * 0.35, dist * 0.85)
    camera.position.lerp(desired, 0.06)
    camera.lookAt(target.current)
  })

  return null
}

function LayerBlock({
  yBase,
  thicknessUm,
  color,
  selected,
  materialId,
  viewMode,
}: {
  yBase: number
  thicknessUm: number
  color: string
  selected: boolean
  materialId: string
  viewMode: ViewMode
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const h = Math.max(0.08, thicknessUm * THICKNESS_SCALE)
  const appear = useRef(0)
  const kind = visualKind(materialId)
  const params = materialParams(kind, selected)
  const particles = useMemo(
    () => seededPoints(materialId, kind === 'active' ? 40 : kind === 'carbon' ? 48 : kind === 'gel' ? 28 : 0, 1.92, 1.36, 0),
    [kind, materialId],
  )

  useFrame((_, dt) => {
    appear.current = Math.min(1, appear.current + dt * 2.8)
    if (meshRef.current) {
      const s = 0.82 + appear.current * 0.18
      meshRef.current.scale.set(s, 1, s)
      if (selected) {
        meshRef.current.position.y = Math.sin(Date.now() * 0.004) * 0.025
      } else {
        meshRef.current.position.y = 0
      }
    }
  })

  const width = viewMode === 'cross-section' ? 1.12 : viewMode === 'stack' ? 2.4 : 2.08

  return (
    <group position={[0, yBase + h / 2, 0]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[width, h, viewMode === 'stack' ? 0.42 : 1.38]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? '#22d3ee' : kind === 'gel' ? '#0e7490' : '#000000'}
          emissiveIntensity={params.emissiveIntensity}
          metalness={params.metalness}
          roughness={params.roughness}
          transparent={params.transparent}
          opacity={viewMode === 'cross-section' && kind === 'metal' ? 0.42 : params.opacity}
        />
      </mesh>

      {(kind === 'active' || kind === 'carbon' || kind === 'gel') &&
        particles.map((p, idx) => (
          <mesh key={idx} position={[p.x, p.y, p.z]} castShadow>
            <sphereGeometry args={[p.r, 8, 8]} />
            <meshStandardMaterial
              color={kind === 'carbon' ? '#0f172a' : kind === 'gel' ? '#67e8f9' : '#c4b5fd'}
              emissive={kind === 'gel' ? '#0891b2' : '#000000'}
              emissiveIntensity={kind === 'gel' ? 0.35 : 0}
            />
          </mesh>
        ))}

      {kind === 'separator' && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width + 0.08, 1.42, 16, 10]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.22} wireframe />
        </mesh>
      )}

      {selected && (
        <>
          <mesh position={[0, h / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[width * 0.62, width * 0.68, 48]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.95} />
          </mesh>
          <pointLight position={[0, h / 2 + 0.2, 0.6]} intensity={1.2} color="#22d3ee" distance={2.5} />
        </>
      )}
    </group>
  )
}

function StackAssembly({ viewMode }: { viewMode: ViewMode }) {
  const layers = useProjectStore(s => s.layers)
  const selectedLayerId = useProjectStore(s => s.selectedLayerId)
  const selectLayer = useProjectStore(s => s.selectLayer)
  const groupRef = useRef<THREE.Group>(null)

  const layout = useMemo(() => {
    let y = 0.06
    const gap =
      viewMode === 'exploded' ? LAYER_GAP * 2.8 : viewMode === '3d' ? 0.008 : viewMode === 'stack' ? LAYER_GAP * 0.35 : LAYER_GAP
    return layers.map((layer, index) => {
      const h = Math.max(0.08, layer.thicknessUm * THICKNESS_SCALE)
      const entry = { layer, yBase: y, index, h }
      y += h + gap
      return entry
    })
  }, [layers, viewMode])

  const stackHeight = layout.length > 0 ? layout[layout.length - 1].yBase + layout[layout.length - 1].h : 0.5
  const stackCenter = stackHeight / 2

  useFrame((_, dt) => {
    if (groupRef.current && viewMode !== 'stack') {
      groupRef.current.rotation.y += dt * 0.1
    } else if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.08)
    }
  })

  return (
    <>
      <CameraRig stackCenter={stackCenter} stackHeight={stackHeight} viewMode={viewMode} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[6, 12, 6]} intensity={1.4} castShadow />
      <directionalLight position={[-5, 8, -4]} intensity={0.55} color="#a5f3fc" />
      <pointLight position={[0, stackCenter + 1.5, 2]} intensity={0.8} color="#22d3ee" />
      <Grid position={[0, 0, 0]} args={[16, 16]} cellSize={0.35} cellColor="#cbd5e1" sectionColor="#94a3b8" />
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={() => selectLayer(null)}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 0.1, 1.82]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.25} />
      </mesh>

      {layers.length > 0 && (
        <mesh position={[0, stackHeight + 0.28, 0]} castShadow>
          <boxGeometry args={[2.48, 0.07, 1.72]} />
          <meshStandardMaterial color="#334155" metalness={0.55} roughness={0.22} />
        </mesh>
      )}

      <group ref={groupRef} position={[0, 0, 0]}>
        {layout.map(({ layer, yBase, index }) => (
          <group
            key={layer.id}
            onClick={e => {
              e.stopPropagation()
              selectLayer(layer.id)
            }}
          >
            <LayerBlock
              yBase={yBase}
              thicknessUm={layer.thicknessUm}
              color={layer.color}
              selected={selectedLayerId === layer.id}
              materialId={layer.materialId}
              viewMode={viewMode}
            />
          </group>
        ))}
      </group>

      {layers.length === 0 && (
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.8, 0.2, 1.2]} />
          <meshStandardMaterial color="#334155" transparent opacity={0.5} wireframe />
        </mesh>
      )}
    </>
  )
}

export function MaterialsAssemblyScene({ viewMode = 'exploded' }: { viewMode?: ViewMode }) {
  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200/80 shadow-inner">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [4, 2.2, 5], fov: 40, near: 0.1, far: 100 }}
        className="!absolute inset-0 h-full w-full"
        onPointerMissed={() => useProjectStore.getState().selectLayer(null)}
      >
        <Suspense fallback={null}>
          <StackAssembly viewMode={viewMode} />
          <OrbitControls
            makeDefault
            target={[0, 0.8, 0]}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.02}
            enablePan={false}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
