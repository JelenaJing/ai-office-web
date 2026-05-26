/**
 * 项目浏览器组件
 */
import { useState } from 'react';
import FileTree from './FileTree';
import FileViewer from './FileViewer';
import './ProjectExplorer.css';

interface ProjectExplorerProps {
  projectId: string;
}

export default function ProjectExplorer({ projectId }: ProjectExplorerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (!projectId) {
    return (
      <div className="project-explorer-empty">
        <p>请先选择一个项目</p>
      </div>
    );
  }

  return (
    <div className="project-explorer">
      <div className="project-explorer-tree">
        <FileTree projectId={projectId} onFileSelect={setSelectedFile} />
      </div>
      <div className="project-explorer-viewer">
        <FileViewer projectId={projectId} filePath={selectedFile} />
      </div>
    </div>
  );
}
