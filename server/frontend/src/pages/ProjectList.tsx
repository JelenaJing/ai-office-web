/**
 * 项目列表页面
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paperAPI } from '../services/api';
import type { Project } from '../types';
import './ProjectList.css';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await paperAPI.listProjects();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('加载项目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const projectData = await paperAPI.upload(file);
      navigate(`/project/${projectData.project_id}`);
    } catch (error: any) {
      console.error('上传失败:', error);
      alert(`上传失败: ${error.response?.data?.detail || error.message || '未知错误'}`);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      created: '#999',
      processing: '#1890ff',
      completed: '#52c41a',
      error: '#ff4d4f',
    };
    return colorMap[status] || '#999';
  };

  if (loading) {
    return (
      <div className="project-list-loading">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h1>项目列表</h1>
        <div className="project-list-actions">
          <label className="project-list-upload-btn">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={loading}
            />
            上传论文
          </label>
          <button onClick={loadProjects} className="project-list-refresh" disabled={loading}>
            刷新
          </button>
        </div>
      </div>
      <div className="project-list-content">
        {projects.length === 0 ? (
          <div className="project-list-empty">
            <p>暂无项目</p>
            <p className="project-list-empty-hint">请上传论文以创建新项目</p>
            <label className="project-list-upload-btn-large">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={loading}
              />
              📄 点击上传论文
            </label>
          </div>
        ) : (
          <div className="project-list-grid">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className="project-card"
                onClick={() => handleOpenProject(project.project_id)}
              >
                <div className="project-card-header">
                  <h3 className="project-card-title">{project.paper_filename}</h3>
                  <span
                    className="project-card-status"
                    style={{ color: getStatusColor(project.status) }}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="project-card-body">
                  <div className="project-card-info">
                    <span className="project-card-label">项目ID:</span>
                    <span className="project-card-value">{project.project_id}</span>
                  </div>
                  <div className="project-card-info">
                    <span className="project-card-label">创建时间:</span>
                    <span className="project-card-value">{formatDate(project.created_at)}</span>
                  </div>
                  <div className="project-card-info">
                    <span className="project-card-label">更新时间:</span>
                    <span className="project-card-value">{formatDate(project.updated_at)}</span>
                  </div>
                </div>
                <div className="project-card-footer">
                  <button
                    className="project-card-open"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProject(project.project_id);
                    }}
                  >
                    打开项目
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
