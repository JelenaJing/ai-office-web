/**
 * 可调整大小的面板组件
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import './ResizablePanel.css';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onResize?: (width: number) => void;
  position?: 'left' | 'right';
}

export default function ResizablePanel({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 800,
  onResize,
  position = 'right'
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    // 计算鼠标移动的距离
    const deltaX = e.clientX - startXRef.current;
    
    // 根据面板位置计算新宽度
    // 右侧面板：鼠标向右移动（deltaX > 0）时，面板变窄；鼠标向左移动（deltaX < 0）时，面板变宽
    // 左侧面板：鼠标向右移动（deltaX > 0）时，面板变宽；鼠标向左移动（deltaX < 0）时，面板变窄
    const newWidth = position === 'right' 
      ? Math.max(minWidth, Math.min(maxWidth, startWidthRef.current - deltaX))
      : Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
    
    setWidth(newWidth);
    onResize?.(newWidth);
  }, [isResizing, minWidth, maxWidth, position, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('resizing');
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={`resizable-panel resizable-panel-${position}`}
      style={{ width: `${width}px`, minWidth: `${minWidth}px`, maxWidth: `${maxWidth}px` }}
    >
      {position === 'left' && (
        <div
          className={`resize-handle resize-handle-${position} ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
        />
      )}
      <div className="resizable-panel-content">
        {children}
      </div>
      {position === 'right' && (
        <div
          className={`resize-handle resize-handle-${position} ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}
