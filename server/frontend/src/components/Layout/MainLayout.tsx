/**
 * 主布局组件
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PDFViewer from '../PDFViewer/PDFViewer';
import ImageCollageOverlay from '../ImageCollage/ImageCollageOverlay';
import FunctionPanel from '../Sidebar/FunctionPanel';
import ProjectExplorer from '../ProjectExplorer';
import ResultDisplay from '../Sidebar/ResultDisplay';
import { paperAPI, dataAPI, remakeAPI } from '../../services/api';
import type { Project } from '../../types';

const REMAKE_LOADING_LABELS: Record<string, string> = {
  idea: '正在生成科研 Idea…',
  check: '内容检查生成中…',
  experiment: '实验设计生成中…',
  'extract-experiment': '正在提取实验内容…',
  'visualize-experiment': 'DeepSyn 可视化处理中…',
  'recipe-experiment': '机器配方转写中…',
  theory: '理论分析与公式推导生成中…',
  introduction: 'Introduction 顶刊重写中…',
  overall: '全文整体检查中…',
};

export default function MainLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showExplorer, setShowExplorer] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [remakeLoading, setRemakeLoading] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [showPlotUpload, setShowPlotUpload] = useState(false);
  const [showImageCollage, setShowImageCollage] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [templatePreviewLoading, setTemplatePreviewLoading] = useState(false);
  const [templatePreviewData, setTemplatePreviewData] = useState<any[] | null>(null);
  const [plotFile, setPlotFile] = useState<File | null>(null);
  const [plotJsonData, setPlotJsonData] = useState<any | null>(null);
  const [plotRecommend, setPlotRecommend] = useState<any | null>(null);
  const [plotMode, setPlotMode] = useState<'auto' | 'manual'>('auto');
  const [manualParams, setManualParams] = useState<{ x?: string; y?: string; hue?: string; title?: string; xlabel?: string; ylabel?: string; style?: string; chart_type?: string }>({
    style: 'publication',
  });

  const ALL_CHART_TYPES: { value: string; label: string }[] = [
    { value: 'bar', label: '柱状图 (bar)' },
    { value: 'line', label: '折线图 (line)' },
    { value: 'scatter', label: '散点图 (scatter)' },
    { value: 'histogram', label: '直方图 (histogram)' },
    { value: 'heatmap', label: '热力图 (heatmap)' },
    { value: 'box', label: '箱线图 (box)' },
    { value: 'violin', label: '小提琴图 (violin)' },
    { value: 'pie', label: '饼图 (pie)' },
    { value: 'volcano', label: '火山图 (volcano)' },
    { value: 'errorbar', label: '误差棒图 (errorbar)' },
    { value: 'hexbin', label: '六边形密度图 (hexbin)' },
    { value: 'contour', label: '等高线图 (contour)' },
    { value: 'radar', label: '雷达图 (radar)' },
    { value: 'pareto', label: '帕累托图 (pareto)' },
    { value: 'waterfall', label: '瀑布图 (waterfall)' },
    { value: 'candlestick', label: '蜡烛图 (candlestick)' },
    { value: 'wind_rose', label: '风玫瑰图 (wind_rose)' },
    { value: 'polar', label: '极坐标图 (polar)' },
    { value: 'circular_bar', label: '环形柱图 (circular_bar)' },
    { value: 'parallel_coordinates', label: '平行坐标图 (parallel_coordinates)' },
    { value: 'trellis', label: '分面图 (trellis)' },
    { value: 'network_graph', label: '网络图 (network_graph)' },
    { value: 'stream', label: '流场图 (stream)' },
    { value: '3d_scatter', label: '3D散点图 (3d_scatter)' },
    { value: '3d_bubble', label: '3D气泡图 (3d_bubble)' },
    { value: '3d_surface', label: '3D曲面图 (3d_surface)' },
  ];

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadProject = async (id: string) => {
    try {
      const projectData = await paperAPI.getProject(id);
      setProject(projectData);

    } catch (error: any) {
      console.error('加载项目失败:', error);
      alert(`加载项目失败: ${error.message}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const projectData = await paperAPI.upload(file);
      navigate(`/project/${projectData.project_id}`);
    } catch (error: any) {
      alert(`上传失败: ${error.message}`);
    }
  };

  const handleTextSelection = (text: string) => {
    setSelectedText(text);
  };

  const handlePlotFileUpload = async (file: File) => {
    setPlotFile(file);
    // TODO: 接入画图功能
    console.log('准备画图，文件:', file.name);
    // 这里之后会调用画图API
    // const response = await plotAPI.generatePlot(project?.project_id, file);
  };

  const handleClosePlotUpload = () => {
    setShowPlotUpload(false);
    setPlotFile(null);
    setPlotJsonData(null);
    setPlotRecommend(null);
  };

  const onRemakeLoadingChange = useCallback((type: string | null) => {
    setRemakeLoading(type);
  }, []);

  const handleBatchInsertReferences = useCallback(async (paperMarkdown: string) => {
    if (!project?.project_id) return;
    try {
      setRemakeLoading('check');
      // topic 交由后端从全文自动提炼（标题/摘要优先）
      const response = await remakeAPI.insertReference(project.project_id, paperMarkdown, '');
      setResult({
        ...response,
        updated_text: response.updated_markdown,
        updated_references: (response.reference_list || []).map((citation: string, idx: number) => ({
          title: citation,
          authors: '',
          year: '',
          doi: '',
          sentence_text: '',
          relevance_reason: `Inserted reference #${idx + 1}`,
        })),
      });
    } catch (error: any) {
      alert(`插入 reference 失败: ${error?.message || '未知错误'}`);
    } finally {
      setRemakeLoading(null);
    }
  }, [project]);

  const handleInsertReferencesFromFullText = useCallback(async () => {
    if (!project?.project_id) return;
    const content = await paperAPI.getContent(project.project_id);
    const fullText = content?.text || content?.content || '';
    if (!fullText || !String(fullText).trim()) {
      alert('未能读取到全文内容');
      return;
    }
    await handleBatchInsertReferences(String(fullText));
  }, [project, handleBatchInsertReferences]);

  return (
    <div
      className={`main-layout ${showPlotUpload ? 'has-plot-upload' : ''}`}
    >
      <header className="header">
        <h1>论文Remake服务</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/')}>项目列表</button>
          <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} />
          {project && <span>项目: {project.paper_filename}</span>}
          <button onClick={() => setShowExplorer(!showExplorer)}>
            {showExplorer ? '隐藏' : '显示'}文件浏览器
          </button>
        </div>
      </header>
      <div className="content-area">
        {/* 左侧：结果展示区域 - 始终显示 */}
        <div className="result-panel-left">
          <div className="result-panel-header">
            <h4>结果：</h4>
            {result && (
              <div className="result-panel-actions">
                <button
                  type="button"
                  className="result-popout-btn"
                  onClick={() => setIsResultModalOpen(true)}
                  title="在新窗口中查看结果"
                >
                  弹出
                </button>
              </div>
            )}
          </div>
          <div className="result-panel-body">
            {result ? (
              <ResultDisplay 
                result={result} 
                onBatchInsertReferences={handleBatchInsertReferences}
                onUseForVisualization={async (experimentText: string) => {
                  if (!project?.project_id) return;
                  try {
                    const response = await (await import('../../services/api')).remakeAPI.visualizeExperiment(project.project_id, experimentText);
                    setResult(response);
                  } catch (error: any) {
                    alert(`可视化失败: ${error.message}`);
                  }
                }}
                onRecipeFromOperations={async (operations: any[]) => {
                  if (!project?.project_id) return;
                  try {
                    const response = await (await import('../../services/api')).remakeAPI.recipeExperiment(project.project_id, operations);
                    setResult(response);
                  } catch (error: any) {
                    alert(`转写失败: ${error.message}`);
                  }
                }}
              />
            ) : remakeLoading ? (
              <div className="result-generating-state result-empty-state" role="status" aria-live="polite">
                <div className="remake-spinner remake-spinner--lg" aria-hidden="true" />
                <div className="result-empty-text">
                  <p className="result-generating-title">正在处理…</p>
                  <p className="result-generating-sub">
                    {REMAKE_LOADING_LABELS[remakeLoading] ?? '已连接服务，请稍候'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="result-empty-state">
                <div className="result-empty-icon">📄</div>
                <div className="result-empty-text">
                  <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: '#333' }}>
                    等待结果
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#666', lineHeight: '1.5' }}>
                    在右侧选择功能并执行后，<br />
                    结果将显示在这里
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 弹窗：可缩放结果查看 */}
        {result && isResultModalOpen && (
          <div
            className="result-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              // 点击遮罩关闭（点到内容区域不关闭）
              if (e.target === e.currentTarget) setIsResultModalOpen(false);
            }}
          >
            <div className="result-modal">
              <div className="result-modal-header">
                <div className="result-modal-title">结果（可拖拽缩放右下角）</div>
                <button
                  type="button"
                  className="result-modal-close"
                  onClick={() => setIsResultModalOpen(false)}
                >
                  关闭
                </button>
              </div>
              <div className="result-modal-body">
                <ResultDisplay 
                  result={result} 
                  onBatchInsertReferences={handleBatchInsertReferences}
                  onUseForVisualization={async (experimentText: string) => {
                    if (!project?.project_id) return;
                    try {
                      const response = await (await import('../../services/api')).remakeAPI.visualizeExperiment(project.project_id, experimentText);
                      setResult(response);
                    } catch (error: any) {
                      alert(`可视化失败: ${error.message}`);
                    }
                  }}
                  onRecipeFromOperations={async (operations: any[]) => {
                    if (!project?.project_id) return;
                    try {
                      const response = await (await import('../../services/api')).remakeAPI.recipeExperiment(project.project_id, operations);
                      setResult(response);
                    } catch (error: any) {
                      alert(`转写失败: ${error.message}`);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* 中间：PDF预览区域 */}
        {project && (
          <div className="pdf-panel">
            <PDFViewer
              file={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/paper/${project.project_id}/pdf`}
              onTextSelect={handleTextSelection}
            />
          </div>
        )}
        
        {/* 右侧：功能按钮面板 */}
        <div className="function-panel-right">
          <FunctionPanel
            projectId={project?.project_id || null}
            selectedText={selectedText}
            onLoadingChange={onRemakeLoadingChange}
            onResult={(_type, res) => setResult(res)}
            onInsertReference={handleInsertReferencesFromFullText}
            onPlotClick={() => {
              setShowImageCollage(false);
              setShowPlotUpload(true);
            }}
            onCollageClick={() => {
              setShowPlotUpload(false);
              setShowImageCollage(true);
            }}
          />
        </div>
        
        {/* 文件浏览器 */}
        {showExplorer && project && (
          <div className="explorer-panel">
            <ProjectExplorer projectId={project.project_id} />
          </div>
        )}
      </div>
      
      {/* 底部画图上传区域 */}
      {showPlotUpload && (
        <div className="plot-upload-panel">
          <div className="plot-upload-header">
            <h4>📊 画图工具</h4>
            <button
              type="button"
              className="plot-upload-close"
              onClick={handleClosePlotUpload}
            >
              ✕
            </button>
          </div>
          <div className="plot-upload-content">
            <div className="plot-upload-area">
              <input
                type="file"
                id="plot-file-input"
                accept=".csv,.xlsx,.xls,.txt,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePlotFileUpload(file);
                  }
                }}
                style={{ display: 'none' }}
              />
              <label htmlFor="plot-file-input" className="plot-upload-label">
                {plotFile ? (
                  <div className="plot-file-selected">
                    <span className="plot-file-name">📄 {plotFile.name}</span>
                    <span className="plot-file-size">
                      ({(plotFile.size / 1024).toFixed(2)} KB)
                    </span>
                    <button
                      type="button"
                      className="plot-file-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlotFile(null);
                        const input = document.getElementById('plot-file-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                    >
                      移除
                    </button>
                  </div>
                ) : (
                  <div className="plot-upload-placeholder">
                    <div className="plot-upload-icon">📁</div>
                    <div className="plot-upload-text">
                      <p>点击或拖拽文件到此处上传</p>
                      <p className="plot-upload-hint">支持 CSV, Excel, TXT, JSON 格式</p>
                    </div>
                  </div>
                )}
              </label>
              {plotFile && (
                <div className="plot-upload-actions">
                  <button
                    type="button"
                    className="plot-generate-btn"
                    onClick={() => {
                      if (!plotFile) return;
                      (async () => {
                        try {
                          const res = await dataAPI.generatePlot(project?.project_id || null, plotFile, undefined, true);
                          setResult(res);
                        } catch (e: any) {
                          alert(`画图失败: ${e?.message || '未知错误'}`);
                        }
                      })();
                    }}
                  >
                    🎨 生成图表
                  </button>
                </div>
              )}
              <div className="plot-upload-actions">
                <button
                  type="button"
                  className="plot-generate-btn"
                  onClick={() => {
                    (async () => {
                      try {
                        setTemplatePreviewLoading(true);
                        const res = await dataAPI.getPlotTemplatePreviews({ style: 'all', use_llm: false });
                        setTemplatePreviewData(Array.isArray(res?.templates) ? res.templates : []);
                        setShowTemplatePreview(true);
                      } catch (e: any) {
                        alert(`加载模板预览失败: ${e?.message || '未知错误'}`);
                      } finally {
                        setTemplatePreviewLoading(false);
                      }
                    })();
                  }}
                >
                  {templatePreviewLoading ? '加载模板预览中…' : '🧩 查看全部模板预览'}
                </button>
              </div>
              <div className="plot-upload-actions">
                <button
                  type="button"
                  className="plot-generate-btn"
                  onClick={() => {
                    (async () => {
                      try {
                        const spectral = await dataAPI.generateSpectralData();
                        setPlotJsonData(spectral);
                        const rec = await dataAPI.recommendPlotFromJson({
                          project_id: project?.project_id || null,
                          data: spectral,
                        });
                        setPlotRecommend(rec);
                        const res = await dataAPI.generatePlotFromJson({
                          project_id: project?.project_id || null,
                          data: spectral,
                          auto_recommend: true,
                          style: 'publication',
                          title: 'Spectral Data Visualization',
                          xlabel: 'Wavelength (nm)',
                          ylabel: 'Intensity',
                        });
                        setResult(res);
                      } catch (e: any) {
                        alert(`生成光谱并作图失败: ${e?.message || '未知错误'}`);
                      }
                    })();
                  }}
                  disabled={!project}
                  title={!project ? '请先选择/打开一个项目' : undefined}
                >
                  🧪 生成光谱数据并作图
                </button>
              </div>

              {plotRecommend?.options?.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <strong>推荐图表：</strong>
                    <button
                      type="button"
                      className="plot-file-remove"
                      onClick={() => setPlotMode(plotMode === 'auto' ? 'manual' : 'auto')}
                      title="切换：AI自动匹配参数 / 手动设置参数"
                    >
                      模式：{plotMode === 'auto' ? 'AI自动' : '手动'}
                    </button>
                  </div>
                  {plotMode === 'manual' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        placeholder="x 列名 (可选)"
                        value={manualParams.x || ''}
                        onChange={(e) => setManualParams({ ...manualParams, x: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                      />
                      <input
                        placeholder="y 列名 (可选)"
                        value={manualParams.y || ''}
                        onChange={(e) => setManualParams({ ...manualParams, y: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                      />
                      <input
                        placeholder="hue 列名 (可选)"
                        value={manualParams.hue || ''}
                        onChange={(e) => setManualParams({ ...manualParams, hue: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                      />
                      <input
                        placeholder="标题 title (可选)"
                        value={manualParams.title || ''}
                        onChange={(e) => setManualParams({ ...manualParams, title: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                      />
                      <input
                        placeholder="x轴 xlabel (可选)"
                        value={manualParams.xlabel || ''}
                        onChange={(e) => setManualParams({ ...manualParams, xlabel: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                      />
                      <input
                        placeholder="y轴 ylabel (可选)"
                        value={manualParams.ylabel || ''}
                        onChange={(e) => setManualParams({ ...manualParams, ylabel: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                      />
                      <select
                        value={manualParams.chart_type || ''}
                        onChange={(e) => setManualParams({ ...manualParams, chart_type: e.target.value || undefined })}
                        style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', gridColumn: 'span 2' }}
                        title="手动指定图表类型（可选，留空则使用推荐）"
                      >
                        <option value="">-- 图表类型（可选，留空使用AI推荐）--</option>
                        {ALL_CHART_TYPES.map((ct) => (
                          <option key={ct.value} value={ct.value}>{ct.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="plot-generate-btn"
                        disabled={!plotJsonData}
                        style={{ padding: '8px 16px', fontWeight: 600 }}
                        onClick={() => {
                          (async () => {
                            try {
                              const payload: any = {
                                project_id: project?.project_id || null,
                                data: plotJsonData,
                                chart_type: manualParams.chart_type || undefined,
                                auto_recommend: !manualParams.chart_type,
                                style: manualParams.style || 'publication',
                                x: manualParams.x || undefined,
                                y: manualParams.y || undefined,
                                hue: manualParams.hue || undefined,
                                title: manualParams.title || undefined,
                                xlabel: manualParams.xlabel || undefined,
                                ylabel: manualParams.ylabel || undefined,
                              };
                              const res = await dataAPI.generatePlotFromJson(payload);
                              setResult(res);
                            } catch (e: any) {
                              alert(`生成图表失败: ${e?.message || '未知错误'}`);
                            }
                          })();
                        }}
                      >
                        🎨 生成
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {plotRecommend.options.slice(0, 5).map((opt: any, idx: number) => (
                      <button
                        key={`${opt.chart_type}-${idx}`}
                        type="button"
                        className="plot-generate-btn"
                        onClick={() => {
                          (async () => {
                            try {
                              const suggested = opt.suggested_parameters || {};
                              const payload: any = {
                                project_id: project?.project_id || null,
                                data: plotJsonData,
                                chart_type: opt.chart_type,
                                auto_recommend: false,
                                style: manualParams.style || 'publication',
                              };

                              if (plotMode === 'auto') {
                                payload.x = suggested.x ?? undefined;
                                payload.y = suggested.y ?? undefined;
                                payload.hue = suggested.hue ?? undefined;
                                payload.title = suggested.title ?? undefined;
                                payload.xlabel = suggested.xlabel ?? undefined;
                                payload.ylabel = suggested.ylabel ?? undefined;
                              } else {
                                payload.x = manualParams.x || undefined;
                                payload.y = manualParams.y || undefined;
                                payload.hue = manualParams.hue || undefined;
                                payload.title = manualParams.title || undefined;
                                payload.xlabel = manualParams.xlabel || undefined;
                                payload.ylabel = manualParams.ylabel || undefined;
                              }

                              const res = await dataAPI.generatePlotFromJson(payload);
                              setResult(res);
                            } catch (e: any) {
                              alert(`生成图表失败: ${e?.message || '未知错误'}`);
                            }
                          })();
                        }}
                        title={opt.reasoning || undefined}
                      >
                        {opt.chart_type} ({Math.round((opt.confidence ?? 0) * 100)}%)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showImageCollage && (
        <ImageCollageOverlay
          projectId={project?.project_id ?? null}
          onClose={() => setShowImageCollage(false)}
        />
      )}

      {showTemplatePreview && (
        <div className="template-preview-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setShowTemplatePreview(false);
        }}>
          <div className="template-preview-modal">
            <div className="template-preview-header">
              <h3>模板预览（LLM示例数据 + 预览图）</h3>
              <button type="button" className="result-modal-close" onClick={() => setShowTemplatePreview(false)}>关闭</button>
            </div>
            <div className="template-preview-grid">
              {(templatePreviewData || []).map((t: any, idx: number) => (
                <div className="template-preview-card" key={`${t.chart_type}-${idx}`}>
                  <div className="template-preview-title">{t.chart_type} - {t.title}</div>
                  {t.image_base64 ? (
                    <img src={t.image_base64} alt={t.chart_type} className="template-preview-image" />
                  ) : (
                    <div className="template-preview-error">预览生成失败：{t.error || 'unknown'}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
