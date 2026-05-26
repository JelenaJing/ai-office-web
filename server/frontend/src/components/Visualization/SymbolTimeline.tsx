import React, { useRef, useState, useMemo } from 'react';
import { drawSymbol, drawCombinedSymbol } from '../../utils/symbolDrawer';
import '../../styles/visualization.css';

interface Operation {
  type: 'add' | 'extract' | 'heat' | 'cool' | 'stir' | 'field';
  state?: 'solid' | 'liquid' | 'gas' | '固体' | '液体' | '气体';
  originalIndex?: number;
  [key: string]: any;
}

interface SymbolTimelineProps {
  operations: Operation[];
  mode?: 'normal' | 'combined';
}

// 互斥操作对
const EXCLUSIVE_PAIRS: Record<string, string> = {
  'add': 'extract',
  'extract': 'add',
  'heat': 'cool',
  'cool': 'heat'
};

// 检查两个操作是否互斥
function areExclusive(type1: string, type2: string): boolean {
  return EXCLUSIVE_PAIRS[type1] === type2;
}

// 将操作分组（累积模式）
function groupOperations(operations: Operation[]): Operation[][] {
  const groups: Operation[][] = [];
  let currentGroup: Operation[] = [];
  
  operations.forEach((op, index) => {
    if (currentGroup.length === 0) {
      currentGroup.push({ ...op, originalIndex: index });
    } else {
      // 检查是否与当前组中任何操作互斥
      const hasExclusive = currentGroup.some(groupOp => 
        areExclusive(groupOp.type, op.type)
      );
      
      if (hasExclusive) {
        // 互斥，创建新组
        groups.push([...currentGroup]);
        currentGroup = [{ ...op, originalIndex: index }];
      } else {
        // 兼容，添加到当前组
        currentGroup.push({ ...op, originalIndex: index });
      }
    }
  });
  
  // 添加最后一组
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
}

function getOperationLabel(operation: Operation): string {
  const labels: Record<string, string> = {
    'add': '加入',
    'extract': '提取',
    'heat': '加热',
    'cool': '冷却',
    'stir': '搅拌',
    'field': '外场'
  };
  return labels[operation.type] || operation.type;
}

export default function SymbolTimeline({ operations, mode = 'normal' }: SymbolTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [displayMode, setDisplayMode] = useState<'normal' | 'combined'>(mode);

  // 拖动处理
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // 计算分组（累积模式）
  const operationGroups = useMemo(() => {
    if (displayMode === 'combined') {
      return groupOperations(operations);
    }
    return operations.map((op, idx) => [{ ...op, originalIndex: idx }]);
  }, [operations, displayMode]);

  if (!operations || operations.length === 0) {
    return (
      <div className="empty-timeline">
        <p>暂无数据</p>
      </div>
    );
  }

  // 计算 SVG 尺寸
  const baseSize = 100;
  const scale = 1.5;
  const symbolSize = baseSize * scale;
  const spacing = 50 * scale;
  const arrowLength = 70 * scale;
  const margin = 50 * scale;
  
  const itemCount = displayMode === 'combined' ? operationGroups.length : operations.length;
  const totalWidth = itemCount * (symbolSize + spacing + arrowLength) - arrowLength + 2 * margin;
  const height = symbolSize + 2 * margin + 60;

  return (
    <div className="symbol-timeline-container">
      <div className="timeline-controls">
        <div className="mode-switch">
          <button 
            className={`mode-btn ${displayMode === 'normal' ? 'active' : ''}`}
            onClick={() => setDisplayMode('normal')}
          >
            📊 逐步显示
          </button>
          <button 
            className={`mode-btn ${displayMode === 'combined' ? 'active' : ''}`}
            onClick={() => setDisplayMode('combined')}
          >
            🔗 累积合并
          </button>
        </div>
        <div className="drag-hint">💡 按住鼠标左右拖动查看</div>
      </div>
      
      {displayMode === 'combined' && (
        <div className="mode-info">
          💡 累积模式：相容操作合并显示，互斥操作（加入↔提取、加热↔冷却）分离
        </div>
      )}
      
      <div 
        className={`svg-scroll-container ${isDragging ? 'dragging' : ''}`}
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <svg 
          width={totalWidth} 
          height={height}
          viewBox={`0 0 ${totalWidth} ${height}`}
          className="timeline-svg"
        >
          {displayMode === 'combined' ? (
            // 累积模式渲染
            operationGroups.map((group, groupIndex) => {
              const x = margin + groupIndex * (symbolSize + spacing + arrowLength);
              const y = margin;
              
              return (
                <g key={groupIndex}>
                  {/* 绘制累积符号 */}
                  {drawCombinedSymbol(group, x, y, symbolSize)}
                  
                  {/* 绘制箭头 */}
                  {groupIndex < operationGroups.length - 1 && (
                    <g>
                      <line
                        x1={x + symbolSize + spacing / 2}
                        y1={y + symbolSize / 2}
                        x2={x + symbolSize + spacing / 2 + arrowLength}
                        y2={y + symbolSize / 2}
                        stroke="#94a3b8"
                        strokeWidth={2 * scale} 
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  )}
                  
                  {/* 操作标签（显示所有操作类型） */}
                  <text
                    x={x + symbolSize / 2}
                    y={y + symbolSize + 25 * scale}
                    textAnchor="middle"
                    fontSize={11 * scale}
                    fill="#475569"
                    fontWeight="500"
                  >
                    {group.map(op => getOperationLabel(op)).join('+')}
                  </text>
                  
                  {/* 步骤范围 */}
                  <text
                    x={x + symbolSize / 2}
                    y={y + symbolSize + 40 * scale}
                    textAnchor="middle"
                    fontSize={9 * scale}
                    fill="#94a3b8"
                  >
                    {group.length === 1 
                      ? `步骤 ${(group[0].originalIndex ?? 0) + 1}`
                      : `步骤 ${(group[0].originalIndex ?? 0) + 1}-${(group[group.length - 1].originalIndex ?? 0) + 1}`
                    }
                  </text>
                </g>
              );
            })
          ) : (
            // 普通模式渲染
            operations.map((operation, index) => {
              const x = margin + index * (symbolSize + spacing + arrowLength);
              const y = margin;
              
              return (
                <g key={index}>
                  {drawSymbol(operation, x, y, symbolSize)}
                  
                  {index < operations.length - 1 && (
                    <g>
                      <line
                        x1={x + symbolSize + spacing / 2}
                        y1={y + symbolSize / 2}
                        x2={x + symbolSize + spacing / 2 + arrowLength}
                        y2={y + symbolSize / 2}
                        stroke="#64748b"
                        strokeWidth={2 * scale} 
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  )}
                  
                  <text
                    x={x + symbolSize / 2}
                    y={y + symbolSize + 25 * scale}
                    textAnchor="middle"
                    fontSize={12 * scale}
                    fill="#475569"
                    fontWeight="500"
                  >
                    {getOperationLabel(operation)}
                  </text>
                  
                  <text
                    x={x + symbolSize / 2}
                    y={y + symbolSize + 40 * scale}
                    textAnchor="middle"
                    fontSize={9 * scale}
                    fill="#94a3b8"
                  >
                    步骤 {index + 1}
                  </text>
                </g>
              );
            })
          )}
          
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}
