/**
 * PDF预览组件
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 设置PDF.js worker - 使用CDN确保稳定加载
// 使用CDN可以避免本地worker路径问题，特别是在Vite开发环境中
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  file: string | File | null;
  onTextSelect?: (text: string) => void;
}

export default function PDFViewer({ file, onTextSelect }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [documentKey, setDocumentKey] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('continuous');

  // Memoize options 对象，避免不必要的重新渲染
  const documentOptions = useMemo(() => ({
    httpHeaders: {},
    withCredentials: false,
  }), []);

  // 当文件变化时重置状态
  useEffect(() => {
    if (file) {
      setPageNumber(1);
      setLoading(true);
      setError(null);
      setDocumentLoaded(false);
      setNumPages(0);
      // 增加 key 值，强制 Document 组件重新挂载
      setDocumentKey(prev => prev + 1);
    }
  }, [file]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    setDocumentLoaded(true);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF加载错误:', error);
    // 如果是 Transport destroyed 错误，尝试重新加载
    if (error.message.includes('Transport destroyed') || error.message.includes('destroyed')) {
      console.log('检测到 Transport destroyed 错误，尝试重新加载...');
      setTimeout(() => {
        setDocumentKey(prev => prev + 1);
        setError(null);
        setLoading(true);
      }, 100);
    } else {
      setError(`PDF加载失败: ${error.message}`);
      setLoading(false);
      setDocumentLoaded(false);
    }
  }, []);

  const handleTextSelect = (event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onTextSelect?.(selection.toString().trim());
    }
  };

  const handlePageLoadError = useCallback((error: Error) => {
    console.error('PDF页面加载错误:', error);
    // Transport destroyed 错误通常是临时性的，尝试重新加载页面
    if (error.message.includes('Transport destroyed') || error.message.includes('destroyed')) {
      console.log('页面加载时检测到 Transport destroyed，尝试重新加载文档...');
      setDocumentKey(prev => prev + 1);
      setDocumentLoaded(false);
      setLoading(true);
      setError(null);
    } else {
      setError(`页面加载失败: ${error.message}`);
    }
  }, []);

  if (!file) {
    return (
      <div className="pdf-viewer-empty">
        <p>请上传PDF文件</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-error">
        <p>{error}</p>
        <button onClick={() => { setError(null); setLoading(true); setDocumentLoaded(false); }}>重试</button>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        {viewMode === 'single' && (
          <>
            <button onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1 || !documentLoaded}>
              上一页
            </button>
            <span>
              第 {pageNumber} 页 / 共 {numPages || 0} 页
            </span>
            <button onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages || numPages === 0 || !documentLoaded}>
              下一页
            </button>
          </>
        )}
        <button onClick={() => setViewMode(viewMode === 'single' ? 'continuous' : 'single')}>
          {viewMode === 'single' ? '连续翻阅' : '单页模式'}
        </button>
        <button onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}>放大</button>
        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>缩小</button>
        <span>缩放: {Math.round(scale * 100)}%</span>
      </div>
      <div className={`pdf-content ${viewMode === 'continuous' ? 'pdf-content-continuous' : ''}`} onMouseUp={handleTextSelect}>
        {loading && <div className="pdf-loading">加载中...</div>}
        <Document 
          key={documentKey}
          file={file} 
          options={documentOptions}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="pdf-loading">加载中...</div>}
        >
          {documentLoaded && numPages > 0 && (
            viewMode === 'single' ? (
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                onLoadError={handlePageLoadError}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            ) : (
              <div className="pdf-pages-continuous">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div key={pageNum} className="pdf-page-wrapper">
                    <Page 
                      pageNumber={pageNum} 
                      scale={scale}
                      onLoadError={handlePageLoadError}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </Document>
      </div>
    </div>
  );
}
