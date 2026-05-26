/**
 * 文件查看器组件
 */
import { useState, useEffect } from 'react';
import { paperAPI } from '../../services/api';
import type { ProjectFileContent } from '../../types';
import './FileViewer.css';

interface FileViewerProps {
  projectId: string;
  filePath: string | null;
}

export default function FileViewer({ projectId, filePath }: FileViewerProps) {
  const [fileContent, setFileContent] = useState<ProjectFileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && filePath) {
      loadFile();
    } else {
      setFileContent(null);
    }
  }, [projectId, filePath]);

  const loadFile = async () => {
    if (!projectId || !filePath) return;

    setLoading(true);
    setError(null);
    try {
      const data = await paperAPI.getFile(projectId, filePath);
      setFileContent(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载文件失败');
      setFileContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!projectId || !filePath) return;
    const url = paperAPI.downloadFile(projectId, filePath);
    window.open(url, '_blank');
  };

  if (!filePath) {
    return (
      <div className="file-viewer-empty">
        <p>请选择一个文件</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="file-viewer-loading">
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-viewer-error">
        <p>错误: {error}</p>
        <button onClick={loadFile}>重试</button>
      </div>
    );
  }

  if (!fileContent) {
    return null;
  }

  return (
    <div className="file-viewer">
      <div className="file-viewer-header">
        <div className="file-viewer-info">
          <h3>{fileContent.name}</h3>
          <span className="file-viewer-meta">
            {fileContent.type} • {formatSize(fileContent.size)} • {formatDate(fileContent.modified)}
          </span>
        </div>
        <div className="file-viewer-actions">
          {fileContent.type === 'binary' && fileContent.url && (
            <button onClick={() => window.open(fileContent.url, '_blank')}>
              预览
            </button>
          )}
          <button onClick={handleDownload}>下载</button>
        </div>
      </div>
      <div className="file-viewer-content">
        {fileContent.type === 'text' && (
          <pre className="file-viewer-text">{fileContent.content}</pre>
        )}
        {fileContent.type === 'json' && (
          <pre className="file-viewer-json">
            {JSON.stringify(fileContent.content, null, 2)}
          </pre>
        )}
        {fileContent.type === 'binary' && fileContent.url && (
          <div className="file-viewer-binary">
            <p>二进制文件，请使用下载或预览功能</p>
            {fileContent.name.match(/\.(png|jpg|jpeg|gif|svg)$/i) && (
              <img src={fileContent.url} alt={fileContent.name} className="file-viewer-image" />
            )}
            {fileContent.name.match(/\.pdf$/i) && (
              <iframe src={fileContent.url} className="file-viewer-pdf" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}
