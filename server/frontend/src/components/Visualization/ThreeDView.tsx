import React, { useMemo, Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import '../../styles/visualization.css';

interface Operation {
  type: 'add' | 'extract' | 'heat' | 'cool' | 'stir' | 'field';
  state?: 'solid' | 'liquid' | 'gas' | '固体' | '液体' | '气体';
  substance?: string;
  amount?: string;
  temperature?: string;
  time?: string;
  originalIndex?: number;
  [key: string]: any;
}

interface ThreeDViewProps {
  operations: Operation[];
}

const WALL_THICKNESS = 0.03;

// ----------------------------------------------------------------
// 1. 几何形状生成
// ----------------------------------------------------------------

function createRingShape(radius: number, thickness: number = WALL_THICKNESS): THREE.Shape {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  if (thickness > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, radius - thickness, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

function createPolygonBorderShape(radius: number, sides: number, rotation: number = 0, thickness: number = WALL_THICKNESS): THREE.Shape {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / sides;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const theta = i * step + rotation;
    points.push({ x: radius * Math.cos(theta), y: radius * Math.sin(theta) });
  }
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < sides; i++) shape.lineTo(points[i].x, points[i].y);
  shape.closePath();
  if (thickness > 0) {
    const innerRadius = Math.max(0, radius - thickness * 1.2);
    const hole = new THREE.Path();
    for (let i = 0; i < sides; i++) {
      const theta = i * step + rotation;
      const x = innerRadius * Math.cos(theta);
      const y = innerRadius * Math.sin(theta);
      if (i === 0) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    }
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

function createCustomPolygonBorder(points: { x: number; y: number }[], thickness: number = WALL_THICKNESS): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y);
  shape.closePath();
  
  if (thickness > 0) {
    let cx = 0, cy = 0;
    points.forEach(p => { cx += p.x; cy += p.y; });
    cx /= points.length; cy /= points.length;
    
    const hole = new THREE.Path();
    const r = Math.sqrt(Math.pow(points[0].x - cx, 2) + Math.pow(points[0].y - cy, 2));
    const offsetScale = Math.max(0.1, (r - thickness) / r);
    
    const p0x = cx + (points[0].x - cx) * offsetScale;
    const p0y = cy + (points[0].y - cy) * offsetScale;
    hole.moveTo(p0x, p0y);
    for (let i = 1; i < points.length; i++) {
      const px = cx + (points[i].x - cx) * offsetScale;
      const py = cy + (points[i].y - cy) * offsetScale;
      hole.lineTo(px, py);
    }
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

// ----------------------------------------------------------------
// 2. 增强型渐变材质组件
// ----------------------------------------------------------------

interface ExtrudedShapeProps {
  shape: THREE.Shape;
  length: number;
  color: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  capColor?: string;
  position?: [number, number, number];
}

function ExtrudedShape({ shape, length, color, opacity = 1, metalness = 0.4, roughness = 0.3, capColor = "#ffffff", ...props }: ExtrudedShapeProps) {
  const geometry = useMemo(() => {
    return new THREE.ExtrudeGeometry(shape, {
      depth: length,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 48
    });
  }, [shape, length]);

  const capGeometry = useMemo(() => {
    return new THREE.ShapeGeometry(shape, 48);
  }, [shape]);

  const onBeforeCompile = (shader: THREE.Shader) => {
    shader.uniforms.uLength = { value: length };
    shader.vertexShader = `
      varying float vDepth;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vDepth = position.z;
      `
    );
    shader.fragmentShader = `
      varying float vDepth;
      uniform float uLength;
      ${shader.fragmentShader}
    `.replace(
      '#include <alphamap_fragment>',
      `
      float startFade = uLength * 0.1;
      float endFade = uLength;
      float alphaFactor = 1.0;
      if (vDepth > startFade) {
        float progress = (vDepth - startFade) / (endFade - startFade);
        alphaFactor = mix(1.0, 0.1, clamp(progress, 0.0, 1.0));
      }
      diffuseColor.a *= alphaFactor;
      `
    );
  };

  return (
    <group {...props}>
      {/* 黑色/白色起始截面 */}
      <mesh geometry={capGeometry} rotation={[0, -Math.PI / 2, 0]} position={[-0.02, 0, 0]}>
        <meshBasicMaterial color={capColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh geometry={geometry} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial 
          color={color} 
          transparent={true}
          opacity={opacity} 
          side={THREE.DoubleSide}
          metalness={metalness}
          roughness={roughness}
          onBeforeCompile={onBeforeCompile}
          emissive={'#ffffff'}
          emissiveIntensity={0.05} 
        />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------
// 3. 颜色、尺寸与逻辑配置
// ----------------------------------------------------------------

const SIZE = 2.4;
const SHELL_COLOR = '#cbd5e1'; 
const INNER_COLOR = '#94a3b8'; 
const CORE_COLOR = '#64748b';  

const EXCLUSIVE_PAIRS: Record<string, string> = {
  'add': 'extract',
  'extract': 'add',
  'heat': 'cool',
  'cool': 'heat'
};

function areExclusive(type1: string, type2: string): boolean {
  return EXCLUSIVE_PAIRS[type1] === type2;
}

function groupOperations(operations: Operation[]): Operation[][] {
  const groups: Operation[][] = [];
  let currentGroup: Operation[] = [];
  
  operations.forEach((op, index) => {
    if (currentGroup.length === 0) {
      currentGroup.push({ ...op, originalIndex: index });
    } else {
      const hasExclusive = currentGroup.some(groupOp => areExclusive(groupOp.type, op.type));
      if (hasExclusive) {
        groups.push([...currentGroup]);
        currentGroup = [{ ...op, originalIndex: index }];
      } else {
        currentGroup.push({ ...op, originalIndex: index });
      }
    }
  });
  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

interface CoreSubstanceProps {
  state: string;
  length: number;
  capColor: string;
  position?: [number, number, number];
}

function CoreSubstance({ state, length, capColor, position = [0, 0, 0] }: CoreSubstanceProps) {
  const R = SIZE * 0.2;
  const r = R * 0.4; // 物质状态基准
  let shape: THREE.Shape;
  let color = CORE_COLOR;
  if (state === 'solid' || state === '固体') {
    shape = createPolygonBorderShape(r * Math.sqrt(2), 4, Math.PI/4, 0);
  } else if (state === 'gas' || state === '气体') {
    shape = createRingShape(r, 0.02);
    color = '#cbd5e1';
  } else {
    shape = createRingShape(r, 0);
  }
  return <ExtrudedShape shape={shape} length={length} color={color} metalness={0.6} roughness={0.2} capColor={capColor} position={position} />;
}

// ----------------------------------------------------------------
// 4. UI 辅助组件
// ----------------------------------------------------------------

interface InfoSliceProps {
  operation: Operation;
  position: [number, number, number];
  index: number;
}

function InfoSlice({ operation, position }: InfoSliceProps) {
  const params: string[] = [];
  if (operation.substance) params.push(operation.substance);
  if (operation.amount) params.push(operation.amount);
  if (operation.temperature) params.push(operation.temperature);
  if (operation.time) params.push(operation.time);
  
  return (
    <Html position={[position[0], position[1] + 3.0, position[2]]} center distanceFactor={12}>
      <div className="info-slice-v3">
        <div className="info-v3-header">{operation.type.toUpperCase()}</div>
        <div className="info-v3-body">
          {params.map((p, i) => <div key={i} className="info-v3-line">{p}</div>)}
        </div>
      </div>
    </Html>
  );
}

interface SliceIndicatorProps {
  position: [number, number, number];
}

function SliceIndicator({ position }: SliceIndicatorProps) {
  return (
    <Line
      points={[[position[0], 0, 0], [position[0], 3.0, 0]]}
      color="#0ea5e9"
      lineWidth={1}
      transparent
      opacity={0.3}
    />
  );
}

// ----------------------------------------------------------------
// 5. 操作段渲染
// ----------------------------------------------------------------

interface OperationSegmentProps {
  operation: Operation;
  group: Operation[];
  position: [number, number, number];
  length: number;
  index: number;
  showInfo: boolean;
  capColor: string;
}

function OperationSegment({ operation, group, position, length, index, showInfo, capColor }: OperationSegmentProps) {
  const { type } = operation;
  let state = operation.state || 'liquid';
  if (state === '气体') state = 'gas';
  if (state === '液体') state = 'liquid';
  if (state === '固体') state = 'solid';

  // 1. 基准尺寸定义 (与 2D 逻辑严格对齐)
  const R = SIZE * 0.2; // 物质基准圆半径
  const S = R * (1 + Math.sqrt(5)); // 环境基准正方形边长
  const halfS = S / 2;
  const squareVertexRadius = S / Math.sqrt(2); // 正方形中心到顶点的距离
  
  // 2. 物质圆心偏移量 (用于在加热/冷却时实现内切)
  const groupTypes = group ? group.map(op => op.type) : [type];
  
  // Heat 向上 (Y+)，Substance 向下 (Y-)；Cool 向下 (Y-)，Substance 向上 (Y+)
  let substanceOffsetY = 0;
  if (groupTypes.includes('heat')) {
    substanceOffsetY = -R * (Math.sqrt(5) - 1) / 2;
  } else if (groupTypes.includes('cool')) {
    substanceOffsetY = R * (Math.sqrt(5) - 1) / 2;
  }

  const shapes: Array<{ shape?: THREE.Shape; color?: string; position?: [number, number, number]; component?: React.ReactNode }> = [];

  // 1. 物质操作 (add/extract)
  if (type === 'add' || type === 'extract') {
    const corePos: [number, number, number] = [0, substanceOffsetY, 0];
    shapes.push({ shape: createRingShape(R), color: INNER_COLOR, position: corePos });
    const triPoints = type === 'add'
      ? [{x:0, y:-R}, {x:-R*Math.sqrt(3)/2, y:R/2}, {x:R*Math.sqrt(3)/2, y:R/2}]
      : [{x:0, y:R}, {x:-R*Math.sqrt(3)/2, y:-R/2}, {x:R*Math.sqrt(3)/2, y:-R/2}];
    shapes.push({ shape: createCustomPolygonBorder(triPoints), color: INNER_COLOR, position: corePos });
    shapes.push({ component: <CoreSubstance key="core" state={state} length={length} capColor={capColor} position={corePos} /> });
  } 
  // 2. 环境操作 (heat/cool)
  else if (type === 'heat' || type === 'cool') {
    // 正方形居中
    shapes.push({ shape: createPolygonBorderShape(squareVertexRadius, 4, Math.PI/4), color: SHELL_COLOR });
    // Heat 向上 (顶点在 +halfS), Cool 向下 (顶点在 -halfS)
    const points = type === 'heat' 
      ? [{x:0, y:halfS}, {x:-halfS, y:-halfS}, {x:halfS, y:-halfS}] 
      : [{x:0, y:-halfS}, {x:-halfS, y:halfS}, {x:halfS, y:halfS}]; 
    shapes.push({ shape: createCustomPolygonBorder(points), color: INNER_COLOR });
  }
  // 3. 搅拌操作 (stir)
  else if (type === 'stir') {
    const stirOuterRadius = S * Math.sqrt(2) / 2;
    shapes.push({ shape: createRingShape(stirOuterRadius), color: INNER_COLOR });
    shapes.push({ shape: createPolygonBorderShape(squareVertexRadius, 4, Math.PI/4), color: SHELL_COLOR });
  }
  // 4. 外场操作 (field)
  else if (type === 'field') {
    shapes.push({ shape: createPolygonBorderShape(S, 4, 0), color: INNER_COLOR });
    shapes.push({ shape: createPolygonBorderShape(squareVertexRadius, 4, Math.PI/4), color: SHELL_COLOR });
  }

  return (
    <group position={position}>
      {shapes.map((item, idx) => (
        item.component ? (
          <React.Fragment key={idx}>{item.component}</React.Fragment>
        ) : (
          <ExtrudedShape 
            key={idx} 
            shape={item.shape!} 
            length={length} 
            color={item.color!} 
            capColor={capColor} 
            position={item.position || [0, 0, 0]}
          />
        )
      ))}
      {showInfo && (
        <>
          <SliceIndicator position={[length / 2, 0, 0]} />
          <InfoSlice 
            operation={operation} 
            position={[length / 2, 0, 0]} 
            index={index} 
          />
        </>
      )}
    </group>
  );
}

export default function ThreeDView({ operations }: ThreeDViewProps) {
  const [showInfo, setShowInfo] = useState(true);
  const [capColorMode, setCapColorMode] = useState<'white' | 'black'>('white');
  
  const gap = 0.15; 
  const segmentLength = 2.5; 
  
  const operationGroups = useMemo(() => {
    if (!operations) return [];
    return groupOperations(operations);
  }, [operations]);

  if (!operations || operations.length === 0) return <div className="threed-empty"><p>等待数据...</p></div>;

  const currentCapColor = capColorMode === 'white' ? "#ffffff" : "#000000";

  const flatOpsWithGroup = useMemo(() => {
    return operationGroups.flatMap(group => 
      group.map(op => ({ op, group }))
    );
  }, [operationGroups]);

  return (
    <div className="threed-container-v3">
      <div className="threed-controls">
        <div style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'auto' }}>
          <button 
            className={`threed-toggle ${showInfo ? 'active' : ''}`} 
            onClick={() => setShowInfo(!showInfo)}
          >
            {showInfo ? '🏷️ 隐藏详情' : '🏷️ 显示详情'}
          </button>
          
          <button 
            className={`threed-toggle ${capColorMode === 'black' ? 'active' : ''}`}
            onClick={() => setCapColorMode(capColorMode === 'white' ? 'black' : 'white')}
          >
            {capColorMode === 'white' ? '🌑 切换黑边' : '⚪ 切换白边'}
          </button>
        </div>
        <span className="threed-hint">🖱️ 旋转 | 滚轮缩放</span>
      </div>
      
      <Canvas camera={{ position: [15, 12, 20], fov: 30 }}>
        <Suspense fallback={<Html>加载中...</Html>}>
          <ambientLight intensity={0.8} />
          <pointLight position={[20, 20, 20]} intensity={1.5} />
          <pointLight position={[-20, 10, 10]} intensity={0.8} />
          <directionalLight position={[0, 10, 0]} intensity={0.5} />
          <Center>
            <group>
              {flatOpsWithGroup.map(({ op, group }, index) => (
                <OperationSegment
                  key={index}
                  position={[index * (segmentLength + gap), 0, 0]}
                  length={segmentLength}
                  operation={op}
                  group={group}
                  index={index}
                  showInfo={showInfo}
                  capColor={currentCapColor}
                />
              ))}
            </group>
          </Center>
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Suspense>
      </Canvas>
    </div>
  );
}
