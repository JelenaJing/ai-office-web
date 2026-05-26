/**
 * 文件树组件
 */
import { useState, useEffect } from 'react';
import { paperAPI } from '../../services/api';
import type { ProjectFile } from '../../types';
import './FileTree.css';

interface FileTreeProps {
  projectId: string;
  onFileSelect?: (filePath: string) => void;
}

export default function FileTree({ projectId, onFileSelect }: FileTreeProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadFiles('');
    }
  }, [projectId]);

  const loadFiles = async (path: string) => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await paperAPI.listFiles(projectId, path);
      setFiles(data.files || []);
      setCurrentPath(data.path || '');
    } catch (error) {
      console.error('加载文件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (file: ProjectFile) => {
    if (!file.is_directory) {
      onFileSelect?.(file.path);
      return;
    }

    const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    const pathKey = newPath;
    
    if (expandedPaths.has(pathKey)) {
      // 折叠
      setExpandedPaths(prev => {
        const next = new Set(prev);
        next.delete(pathKey);
        return next;
      });
    } else {
      // 展开并加载
      setExpandedPaths(prev => new Set(prev).add(pathKey));
      await loadFiles(newPath);
    }
  };

  const handleBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/');
    loadFiles(newPath);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  if (loading && files.length === 0) {
    return (
      <div className="file-tree-loading">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="file-tree">
      {currentPath && (
        <div className="file-tree-header">
          <button onClick={handleBack} className="file-tree-back">
            ← 返回
          </button>
          <span className="file-tree-path">{currentPath || '根目录'}</span>
        </div>
      )}
      <div className="file-tree-list">
        {files.length === 0 ? (
          <div className="file-tree-empty">文件夹为空</div>
        ) : (
          files.map((file) => (
            <div
              key={file.path}
              className={`file-tree-item ${file.is_directory ? 'directory' : 'file'}`}
              onClick={() => handleFolderClick(file)}
            >
              <span className="file-tree-icon">
                {file.is_directory ? '📁' : getFileIcon(file.name)}
              </span>
              <span className="file-tree-name">{file.name}</span>
              {!file.is_directory && (
                <span className="file-tree-size">{formatSize(file.size)}</span>
              )}
              <span className="file-tree-date">{formatDate(file.modified)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    pdf: '📄',
    json: '📋',
    jsonl: '📋',
    txt: '📝',
    md: '📝',
    tex: '📝',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    csv: '📊',
    xlsx: '📊',
  };
  return iconMap[ext || ''] || '📄';
}
