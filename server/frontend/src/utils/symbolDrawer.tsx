/**
 * 符号绘制工具
 * 根据操作类型绘制对应的化学实验符号
 */

import React from 'react';

interface Operation {
  type: 'add' | 'extract' | 'heat' | 'cool' | 'stir' | 'field';
  state?: 'solid' | 'liquid' | 'gas' | '固体' | '液体' | '气体';
  [key: string]: any;
}

// 绘制基础圆形
function drawCircle(cx: number, cy: number, r: number, fill = 'none', stroke = '#000', strokeWidth = 2) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

// 绘制基础方形
function drawSquare(cx: number, cy: number, size: number, fill = 'none', stroke = '#000', strokeWidth = 2) {
  const halfSize = size / 2;
  return (
    <rect
      x={cx - halfSize}
      y={cy - halfSize}
      width={size}
      height={size}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

// 绘制菱形
function drawDiamond(cx: number, cy: number, size: number, fill = 'none', stroke = '#000', strokeWidth = 2) {
  const points = `${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`;
  return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}

// 绘制物质状态符号
function drawSubstanceState(state: string, cx: number, cy: number, size: number) {
  const normalizedState = String(state).toLowerCase().trim();
  
  switch (normalizedState) {
    case 'gas':
    case '气体':
      return drawCircle(cx, cy, size * 0.12, 'none', '#000', 2);
    case 'liquid':
    case '液体':
      return drawCircle(cx, cy, size * 0.12, '#000', '#000', 2);
    case 'solid':
    case '固体':
      return drawSquare(cx, cy, size * 0.2, '#000', '#000', 2);
    default:
      return drawCircle(cx, cy, size * 0.12, '#000', '#000', 2);
  }
}

/**
 * 绘制加入操作符号
 * 三层嵌套：物质状态 → 倒三角 → 圆
 * 基准圆 (outerRadius) 现在定义为 size * 0.2
 */
export function drawAddSymbol(x: number, y: number, size: number, operation: Operation) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  const state = operation.state || 'liquid';
  
  // 基准圆半径 R = 0.2 * size
  const outerRadius = size * 0.2;
  const triangleEdge = outerRadius * Math.sqrt(3);
  // stateRadius = triangleEdge / (2 * sqrt(3)) = outerRadius / 2
  
  const bottomY = cy + outerRadius;
  const topY = cy - outerRadius / 2;
  const topLeftX = cx - triangleEdge / 2;
  const topRightX = cx + triangleEdge / 2;
  
  return (
    <g>
      {drawCircle(cx, cy, outerRadius, 'none', '#000', 2)}
      <polygon 
        points={`${topLeftX},${topY} ${topRightX},${topY} ${cx},${bottomY}`}
        fill="none"
        stroke="#000"
        strokeWidth="2"
      />
      {drawSubstanceState(state, cx, cy, size * 0.6)}
    </g>
  );
}

/**
 * 绘制提取操作符号
 * 三层嵌套：物质状态 → 正三角 → 圆
 */
export function drawExtractSymbol(x: number, y: number, size: number, operation: Operation) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  const state = operation.state || 'liquid';
  
  const outerRadius = size * 0.2;
  const triangleEdge = outerRadius * Math.sqrt(3);
  
  const topY = cy - outerRadius;
  const bottomY = cy + outerRadius / 2;
  const bottomLeftX = cx - triangleEdge / 2;
  const bottomRightX = cx + triangleEdge / 2;
  
  return (
    <g>
      {drawCircle(cx, cy, outerRadius, 'none', '#000', 2)}
      <polygon 
        points={`${cx},${topY} ${bottomLeftX},${bottomY} ${bottomRightX},${bottomY}`}
        fill="none"
        stroke="#000"
        strokeWidth="2"
      />
      {drawSubstanceState(state, cx, cy, size * 0.6)}
    </g>
  );
}

/**
 * 绘制加热操作符号
 * 逻辑：环境正方形和三角形均居中绘制。
 * 组合显示时，物质基准圆将偏移以实现"三角形外切基准圆"的效果。
 */
export function drawHeatSymbol(x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  const R = size * 0.2;
  const S = R * (1 + Math.sqrt(5));
  const halfS = S / 2;
  
  return (
    <g>
      <rect x={cx - halfS} y={cy - halfS} width={S} height={S} fill="none" stroke="#000" strokeWidth="2" />
      <polygon points={`${cx},${cy - halfS} ${cx - halfS},${cy + halfS} ${cx + halfS},${cy + halfS}`} fill="none" stroke="#000" strokeWidth="2" />
    </g>
  );
}

/**
 * 绘制冷却操作符号
 * 逻辑：环境正方形和三角形均居中绘制。
 */
export function drawCoolSymbol(x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  const R = size * 0.2;
  const S = R * (1 + Math.sqrt(5));
  const halfS = S / 2;
  
  return (
    <g>
      <rect x={cx - halfS} y={cy - halfS} width={S} height={S} fill="none" stroke="#000" strokeWidth="2" />
      <polygon points={`${cx - halfS},${cy - halfS} ${cx + halfS},${cy - halfS} ${cx},${cy + halfS}`} fill="none" stroke="#000" strokeWidth="2" />
    </g>
  );
}

/**
 * 绘制搅拌操作符号
 * 逻辑：正方形居中，且与加热/冷却操作的位置重叠。
 */
export function drawStirSymbol(x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  const R = size * 0.2;
  const S = R * (1 + Math.sqrt(5));
  const outerRadius = S * Math.sqrt(2) / 2;
  
  return (
    <g>
      {drawCircle(cx, cy, outerRadius, 'none', '#000', 2)}
      {drawSquare(cx, cy, S, 'none', '#000', 2)}
    </g>
  );
}

/**
 * 绘制外场操作符号
 * 逻辑：正方形居中，且与加热/冷却操作的位置重叠。
 */
export function drawFieldSymbol(x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  const R = size * 0.2;
  const S = R * (1 + Math.sqrt(5));
  const diamondRadius = S;
  
  return (
    <g>
      {drawDiamond(cx, cy, diamondRadius, 'none', '#000', 2)}
      {drawSquare(cx, cy, S, 'none', '#000', 2)}
    </g>
  );
}

/**
 * 主绘制函数
 */
export function drawSymbol(operation: Operation, x: number, y: number, size: number) {
  switch (operation.type) {
    case 'add': return drawAddSymbol(x, y, size, operation);
    case 'extract': return drawExtractSymbol(x, y, size, operation);
    case 'heat': return drawHeatSymbol(x, y, size);
    case 'cool': return drawCoolSymbol(x, y, size);
    case 'stir': return drawStirSymbol(x, y, size);
    case 'field': return drawFieldSymbol(x, y, size);
    default:
      const cx = x + size / 2;
      const cy = y + size / 2;
      return (
        <g>
          {drawCircle(cx, cy, size * 0.4, 'none', '#000', 2)}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.3} fill="#000">?</text>
        </g>
      );
  }
}

/**
 * 绘制累积组合符号
 * 将多个操作叠加绘制在同一个符号中
 */
export function drawCombinedSymbol(operations: Operation[], x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  const R = size * 0.2;
  const S = R * (1 + Math.sqrt(5));
  const halfS = S / 2;
  
  // 获取唯一的操作类型
  const uniqueTypes = [...new Set(operations.map(op => op.type))];
  
  // 计算物质基准圆的垂直偏移量
  // 当有加热或冷却时，为了使三角形外切于基准圆，物质圆心需要偏移
  let substanceOffsetY = 0;
  if (uniqueTypes.includes('heat')) {
    substanceOffsetY = R * (Math.sqrt(5) - 1) / 2;
  } else if (uniqueTypes.includes('cool')) {
    substanceOffsetY = -R * (Math.sqrt(5) - 1) / 2;
  }
  
  const scy = cy + substanceOffsetY; // 偏移后的物质圆心
  
  const elements: React.ReactNode[] = [];
  
  // 绘制外场层 (field)
  if (uniqueTypes.includes('field')) {
    const diamondRadius = S;
    elements.push(
      <g key="field">
        {drawDiamond(cx, cy, diamondRadius, 'none', '#000', 2)}
        {drawSquare(cx, cy, S, 'none', '#000', 2)}
      </g>
    );
  }
  
  // 绘制搅拌层 (stir)
  if (uniqueTypes.includes('stir')) {
    const stirOuterRadius = S * Math.sqrt(2) / 2;
    elements.push(
      <g key="stir">
        {drawCircle(cx, cy, stirOuterRadius, 'none', '#000', 2)}
        {drawSquare(cx, cy, S, 'none', '#000', 2)}
      </g>
    );
  }
  
  // 绘制温度层 (heat/cool) - 环境层始终居中
  if (uniqueTypes.includes('heat')) {
    elements.push(
      <g key="heat">
        <rect x={cx - halfS} y={cy - halfS} width={S} height={S} fill="none" stroke="#000" strokeWidth="2" />
        <polygon points={`${cx},${cy - halfS} ${cx - halfS},${cy + halfS} ${cx + halfS},${cy + halfS}`} fill="none" stroke="#000" strokeWidth="2" />
      </g>
    );
  }
  
  if (uniqueTypes.includes('cool')) {
    elements.push(
      <g key="cool">
        <rect x={cx - halfS} y={cy - halfS} width={S} height={S} fill="none" stroke="#000" strokeWidth="2" />
        <polygon points={`${cx - halfS},${cy - halfS} ${cx + halfS},${cy - halfS} ${cx},${cy + halfS}`} fill="none" stroke="#000" strokeWidth="2" />
      </g>
    );
  }
  
  // 绘制物质操作层 (add/extract) - 核心层，使用偏移后的坐标
  if (uniqueTypes.includes('add')) {
    const addOp = operations.find(op => op.type === 'add');
    const state = addOp?.state || 'liquid';
    const triangleEdge = R * Math.sqrt(3);
    const bottomY = scy + R;
    const topY = scy - R / 2;
    elements.push(
      <g key="add">
        {drawCircle(cx, scy, R, 'none', '#000', 2)}
        <polygon points={`${cx - triangleEdge / 2},${topY} ${cx + triangleEdge / 2},${topY} ${cx},${bottomY}`} fill="none" stroke="#000" strokeWidth="2" />
        {drawSubstanceState(state, cx, scy, size * 0.6)}
      </g>
    );
  }
  
  if (uniqueTypes.includes('extract')) {
    const extractOp = operations.find(op => op.type === 'extract');
    const state = extractOp?.state || 'liquid';
    const triangleEdge = R * Math.sqrt(3);
    const topY = scy - R;
    const bottomY = scy + R / 2;
    elements.push(
      <g key="extract">
        {drawCircle(cx, scy, R, 'none', '#000', 2)}
        <polygon points={`${cx},${topY} ${cx - triangleEdge / 2},${bottomY} ${cx + triangleEdge / 2},${bottomY}`} fill="none" stroke="#000" strokeWidth="2" />
        {drawSubstanceState(state, cx, scy, size * 0.6)}
      </g>
    );
  }
  
  return <g>{elements}</g>;
}
