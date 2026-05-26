/**
 * 结果展示组件 - 美化显示不同类型的结果
 */
import React, { useState, Suspense, Component, ReactNode } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import './ResultDisplay.css';
import SymbolTimeline from '../Visualization/SymbolTimeline';
import '../../styles/visualization.css';

// 延迟加载 ThreeDView 以避免 React 19 兼容性问题
const ThreeDView = React.lazy(() => import('../Visualization/ThreeDView'));

// ErrorBoundary 组件
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D View Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface ResultDisplayProps {
  result: any;
  onUseForVisualization?: (text: string) => void;
  onRecipeFromOperations?: (operations: any[]) => void;
}

export default function ResultDisplay({ result, onUseForVisualization, onRecipeFromOperations }: ResultDisplayProps) {
  // 提取核心结果数据（排除status、message等元数据）
  const getCoreResult = (data: any) => {
    if (!data) return null;

    // 如果是画图结果
    if (data.plot_base64 || data.plot_url || data.plot_path) {
      return {
        type: 'plot',
        data: {
          plot_base64: data.plot_base64,
          plot_url: data.plot_url,
          plot_path: data.plot_path,
          metadata: data.metadata,
          message: data.message,
        },
      };
    }
    
    // 如果是idea结果
    if (data.ideas && Array.isArray(data.ideas)) {
      return { type: 'idea', data: data.ideas };
    }
    
    // 如果是内容检查结果
    if (data.updated_text || data.updated_references || data.recommended_references || data.issues || data.is_outdated !== undefined) {
      return {
        type: 'check',
        data: {
          updated_text: data.updated_text,
          updated_references: data.updated_references || data.recommended_references || [],
          recommended_references: data.recommended_references || [],
          issues: data.issues || [],
          is_outdated: data.is_outdated,
          latest_papers_count: data.latest_papers_count || 0
        }
      };
    }
    
    // 如果是实验设计结果
    if (data.experiment_design || data.recipe) {
      return {
        type: 'experiment',
        data: {
          experiment_design: data.experiment_design,
          recipe: data.recipe
        }
      };
    }
    
    // 如果是实验提取结果
    if (data.experiment_text !== undefined || data.sections) {
      return {
        type: 'experiment-extract',
        data: {
          experiment_text: data.experiment_text,
          sections: data.sections || [],
          summary: data.summary,
          confidence: data.confidence
        }
      };
    }
    
    // 如果是实验可视化结果
    if (data.operations || data.stats) {
      return {
        type: 'experiment-visualize',
        data: {
          operations: data.operations || [],
          stats: data.stats || {},
          visualization_data: data.visualization_data
        }
      };
    }

    // 如果是机器配方（Step5）结果
    if (data.recipe_export || data.saved_path || (data.stats && (data.stats.liquid_adds_used !== undefined || data.stats.heat_used !== undefined))) {
      return {
        type: 'experiment-recipe',
        data: {
          recipe_export: data.recipe_export || {},
          stats: data.stats || {},
          saved_path: data.saved_path,
          operations_in: data.operations_in || []  // 传递操作列表供预览
        }
      };
    }
    
    // 如果是理论分析结果
    if (data.analysis || data.formulas) {
      return {
        type: 'theory',
        data: {
          analysis: data.analysis,
          formulas: data.formulas || [],
          derivation_steps: data.derivation_steps || []
        }
      };
    }
    
    // 如果是全文检查结果
    if (data.issues || data.suggestions) {
      return {
        type: 'overall',
        data: {
          issues: data.issues || [],
          suggestions: data.suggestions || []
        }
      };
    }

    // Introduction 顶刊重写
    if (Array.isArray(data.literature_pool) && (data.remade_introduction !== undefined || data.original_introduction !== undefined)) {
      return {
        type: 'introduction-remake',
        data: {
          allowed_journals: data.allowed_journals || [],
          literature_pool: data.literature_pool || [],
          literature_pool_meta: data.literature_pool_meta || {},
          original_introduction: data.original_introduction || '',
          remade_introduction: data.remade_introduction || '',
          references: data.references || [],
          continuity_notes: data.continuity_notes || '',
          original_reference_audit: data.original_reference_audit || [],
          search_topic: data.search_topic || '',
          min_publication_year: data.min_publication_year ?? 0,
        },
      };
    }
    
    // 默认返回原始数据
    return { type: 'default', data };
  };

  const coreResult = getCoreResult(result);

  if (!coreResult) {
    return <div className="result-empty">暂无结果</div>;
  }

  switch (coreResult.type) {
    case 'idea':
      return <IdeaDisplay ideas={coreResult.data} />;
    case 'check':
      return <ContentCheckDisplay data={coreResult.data} />;
    case 'experiment':
      return <ExperimentDisplay data={coreResult.data} />;
    case 'experiment-extract':
      return <ExperimentExtractDisplay data={coreResult.data} onUseForVisualization={onUseForVisualization} />;
    case 'experiment-visualize':
      return <ExperimentVisualizeDisplay data={coreResult.data} onRecipeFromOperations={onRecipeFromOperations} />;
    case 'experiment-recipe':
      return <ExperimentRecipeDisplay data={coreResult.data} />;
    case 'theory':
      return <TheoryDisplay data={coreResult.data} />;
    case 'overall':
      return <OverallCheckDisplay data={coreResult.data} />;
    case 'introduction-remake':
      return <IntroductionRemakeDisplay data={coreResult.data} />;
    case 'plot':
      return <PlotDisplay data={coreResult.data} />;
    default:
      return <DefaultDisplay data={coreResult.data} />;
  }
}

function PlotDisplay({ data }: { data: any }) {
  const src = data.plot_base64 || data.plot_url;
  const recommendationText = data?.metadata?.recommendation_text;
  return (
    <div className="result-default">
      <div style={{ marginBottom: '0.75rem' }}>
        <strong>🎨 绘图结果</strong>
        {data.plot_path && (
          <div style={{ marginTop: '0.25rem', color: '#64748b', fontSize: '0.85rem' }}>
            ✓ 已保存: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '3px' }}>{String(data.plot_path).split('/').pop()}</code>
          </div>
        )}
      </div>
      {src ? (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}>
          <img src={src} alt="plot" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
        </div>
      ) : (
        <div className="result-empty">未返回图像数据</div>
      )}
      {recommendationText && (
        <div style={{ marginTop: '0.75rem' }}>
          <strong>推荐信息：</strong>
          <div style={{ marginTop: '0.5rem', lineHeight: 1.6 }}>{recommendationText}</div>
        </div>
      )}
      {/* 兼容旧返回：如果还返回了原始 JSON（未来不应展示），则不再默认展示 */}
      {data.metadata && !recommendationText ? (
        <div style={{ marginTop: '0.75rem' }}>
          <strong>推荐信息：</strong>
          <div style={{ marginTop: '0.5rem', lineHeight: 1.6, color: '#64748b' }}>
            推荐信息已生成，但当前为旧格式返回。请刷新页面后重试生成图表。
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExperimentRecipeDisplay({ data }: { data: any }) {
  const recipeExport = data.recipe_export || {};
  const stats = data.stats || {};
  const savedPath = data.saved_path;
  const operationsIn = data.operations_in || [];
  const [showFullJson, setShowFullJson] = useState(false);
  const [showOperations, setShowOperations] = useState(true);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(recipeExport, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment_recipe_step5.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 提取关键信息用于预览
  const recipe = recipeExport.recipe || {};
  const materialList = recipe.materialList || [];
  const processList = recipe.processList || [];

  // 格式化操作类型显示
  const formatOperationType = (type: string) => {
    const typeMap: Record<string, string> = {
      'add': '➕ 加入',
      'extract': '📤 提取',
      'heat': '🔥 加热',
      'cool': '❄️ 冷却',
      'stir': '🌀 搅拌',
      'field': '⚡ 外场'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="result-experiment-recipe">
      <div className="check-section">
        <strong>🤖 步骤5：机器配方转写结果</strong>
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 500 }}>输入操作数: <span style={{ color: '#3b82f6' }}>{stats.total_ops_in ?? '-'}</span></span>
            <span style={{ fontWeight: 500 }}>液体投料: <span style={{ color: '#10b981' }}>{stats.liquid_adds_used ?? '-'}</span></span>
            <span style={{ fontWeight: 500 }}>加热: <span style={{ color: '#ef4444' }}>{stats.heat_used ?? '-'}</span></span>
            <span style={{ fontWeight: 500 }}>冷却: <span style={{ color: '#3b82f6' }}>{stats.cool_used ?? '-'}</span></span>
            <span style={{ fontWeight: 500 }}>跳过: <span style={{ color: '#94a3b8' }}>{stats.skipped_ops ?? '-'}</span></span>
          </div>
          {savedPath && (
            <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
              ✓ 已保存: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '3px' }}>{savedPath.split('/').pop()}</code>
            </div>
          )}
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="link-btn" onClick={downloadJson}>
            📥 下载JSON
          </button>
          <button type="button" className="link-btn" onClick={() => setShowFullJson(!showFullJson)}>
            {showFullJson ? '📄 收起完整JSON' : '📄 展开完整JSON'}
          </button>
        </div>
      </div>

      {/* 操作步骤预览 */}
      {operationsIn.length > 0 && (
        <div className="check-section" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong>📝 输入操作步骤（共 {operationsIn.length} 步）：</strong>
            <button type="button" className="link-btn" onClick={() => setShowOperations(!showOperations)}>
              {showOperations ? '收起' : '展开'}
            </button>
          </div>
          {showOperations && (
            <div style={{ marginTop: '0.5rem', maxHeight: '400px', overflowY: 'auto', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
              <ol style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                {operationsIn.map((op: any, idx: number) => {
                  const isUsed = (op.type === 'add' && op.state === 'liquid') || op.type === 'heat' || op.type === 'cool';
                  const isSkipped = !isUsed;
                  return (
                    <li key={idx} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: isSkipped ? '#fee2e2' : '#dcfce7', borderRadius: '4px', borderLeft: `3px solid ${isSkipped ? '#ef4444' : '#10b981'}` }}>
                      <div style={{ fontWeight: 500, color: isSkipped ? '#991b1b' : '#166534' }}>
                        {formatOperationType(op.type)} {isSkipped && <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>(已跳过)</span>}
                      </div>
                      {op.substance && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                          物质: {op.substance}
                          {op.amount && <span> | 用量: {op.amount}</span>}
                          {op.state && <span> | 状态: {op.state}</span>}
                        </div>
                      )}
                      {op.temperature && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                          温度: {op.temperature}
                        </div>
                      )}
                      {op.time && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                          时间: {op.time}
                        </div>
                      )}
                      {op.description && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                          描述: {op.description}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* 配方信息预览 */}
      {recipeExport.recipe && (
        <div className="check-section" style={{ marginTop: '1rem' }}>
          <strong>📋 配方信息预览：</strong>
          <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>配方名称：</strong>{recipe.formulaName || '-'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>设备编号：</strong>{recipe.deviceNumber || '-'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>材料数量：</strong>{materialList.length} 个
              {materialList.length > 0 && (
                <ul style={{ marginTop: '0.25rem', marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                  {materialList.slice(0, 5).map((mat: any, idx: number) => (
                    <li key={idx}>{mat.drugName || mat.substance || '-'} ({mat.blockType || '-'})</li>
                  ))}
                  {materialList.length > 5 && <li>... 还有 {materialList.length - 5} 个材料</li>}
                </ul>
              )}
            </div>
            <div>
              <strong>流程数量：</strong>{processList.length} 个
              {processList.length > 0 && (
                <ul style={{ marginTop: '0.25rem', marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                  {processList.map((proc: any, idx: number) => (
                    <li key={idx}>{proc.taskName || '-'} ({proc.taskItemList?.length || 0} 个任务项)</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 完整JSON预览 */}
      {showFullJson && (
        <div className="check-section" style={{ marginTop: '1rem' }}>
          <strong>📄 完整配方JSON（recipe_export）：</strong>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word', 
            marginTop: '0.5rem',
            padding: '1rem',
            background: '#1e293b',
            color: '#e2e8f0',
            borderRadius: '6px',
            fontSize: '0.85rem',
            maxHeight: '500px',
            overflow: 'auto',
            fontFamily: 'Monaco, "Courier New", monospace'
          }}>
            {JSON.stringify(recipeExport, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Idea展示组件
function IdeaDisplay({ ideas }: { ideas: any[] }) {
  return (
    <div className="result-idea">
      {ideas.map((idea, index) => (
        <div key={index} className="idea-item">
          <div className="idea-header">
            <span className="idea-index">{index + 1}</span>
            <h5 className="idea-title">{idea.title || '未命名Idea'}</h5>
          </div>
          {idea.description && (
            <div className="idea-description">
              <strong>描述：</strong>
              <p>{idea.description}</p>
            </div>
          )}
          {idea.innovation && (
            <div className="idea-innovation">
              <strong>创新点：</strong>
              <p>{idea.innovation}</p>
            </div>
          )}
          {idea.references && idea.references.length > 0 && (
            <div className="idea-references">
              <strong>参考文献：</strong>
              <ul>
                {idea.references.map((ref: string, idx: number) => (
                  <li key={idx}>{ref}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 内容检查展示组件
function ContentCheckDisplay({ data }: { data: any }) {
  // 从data字段或直接字段获取信息
  const isOutdated = data.is_outdated !== undefined ? data.is_outdated : (data.data?.is_outdated ?? false);
  const latestPapersCount = data.latest_papers_count ?? data.data?.latest_papers_count ?? 0;
  const recommendedRefs = data.recommended_references ?? data.data?.recommended_references ?? [];
  
  // 合并updated_references和recommended_references，去重
  const allReferences = [...(data.updated_references || [])];
  const refTitles = new Set(allReferences.map((r: any) => r.title));
  for (const ref of recommendedRefs) {
    if (!refTitles.has(ref.title)) {
      allReferences.push(ref);
      refTitles.add(ref.title);
    }
  }
  
  const hasTextUpdate = data.updated_text && data.updated_text.trim() !== '';
  const hasReferences = allReferences.length > 0;
  const hasIssues = data.issues && data.issues.length > 0;
  const originalText = data.original_text || '';
  const showComparison = originalText && originalText !== data.updated_text;
  
  return (
    <div className="result-check">
      {data._streaming && (
        <div className="result-streaming-banner">
          <div className="remake-spinner" aria-hidden="true" />
          <span>流式输出中…（正文逐字更新）</span>
        </div>
      )}
      <div className="check-status">
        <span className={`status-badge ${isOutdated ? 'status-outdated' : 'status-current'}`}>
          {isOutdated ? '⚠️ 内容可能过时' : '✓ 内容较新'}
        </span>
        {latestPapersCount > 0 && (
          <span className="papers-count">找到 {latestPapersCount} 篇相关最新论文</span>
        )}
      </div>
      
      {hasTextUpdate && (
        <div className="check-section">
          <strong>{isOutdated ? '更新后的文本：' : '建议的文本改进：'}</strong>
          {showComparison && (
            <div className="text-comparison">
              <div className="text-original">
                <span className="text-label">原文：</span>
                <div className="text-content">{originalText}</div>
              </div>
              <div className="text-arrow">→</div>
              <div className="text-updated">
                <span className="text-label">更新后：</span>
                <div className="text-content">{data.updated_text}</div>
              </div>
            </div>
          )}
          {!showComparison && (
            <div className="check-text">{data.updated_text}</div>
          )}
        </div>
      )}
      
      {hasReferences && (
        <div className="check-section">
          <strong>可插入的参考文献（{data.matched_count || allReferences.length} 条）：</strong>
          <ul className="check-references">
            {allReferences.map((ref: any, idx: number) => (
              <li key={idx} className="ref-item">
                <div className="ref-content">
                  {ref.title && (
                    <div className="ref-title-line">
                      <span className="ref-title">{ref.title}</span>
                    </div>
                  )}
                  <div className="ref-meta">
                    {ref.authors && <span className="ref-authors">{ref.authors}</span>}
                    {ref.year && <span className="ref-year"> ({ref.year})</span>}
                    {ref.doi && (
                      <a href={ref.doi.startsWith('http') ? ref.doi : `https://doi.org/${ref.doi}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="ref-doi">
                        DOI
                      </a>
                    )}
                  </div>
                  {ref.sentence_text && (
                    <div className="ref-sentence">
                      <strong>匹配的句子：</strong>
                      <span className="sentence-text">"{ref.sentence_text}"</span>
                    </div>
                  )}
                  {ref.relevance_reason && (
                    <div className="ref-relevance">
                      <strong>相关性：</strong>
                      <span className="relevance-text">{ref.relevance_reason}</span>
                    </div>
                  )}
                  {ref.abstract && (
                    <div className="ref-abstract">{ref.abstract}...</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {!hasReferences && latestPapersCount === 0 && (
        <div className="check-section">
          <div className="check-empty">未找到相关的最新论文</div>
        </div>
      )}
      
      {hasIssues && (
        <div className="check-section">
          <strong>发现的问题：</strong>
          <ul className="check-issues">
            {data.issues.map((issue: any, idx: number) => (
              <li key={idx} className={`issue-item issue-${issue.severity || 'medium'}`}>
                <span className="issue-type">{issue.type || '问题'}</span>
                <span className="issue-description">{issue.description}</span>
                {issue.suggestion && (
                  <span className="issue-suggestion">建议：{issue.suggestion}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 实验设计展示组件
function ExperimentDisplay({ data }: { data: any }) {
  return (
    <div className="result-experiment">
      {data.experiment_design && (
        <div className="experiment-section">
          <strong>实验设计：</strong>
          <div className="experiment-design">
            {data.experiment_design.purpose && (
              <div><strong>目的：</strong>{data.experiment_design.purpose}</div>
            )}
            {data.experiment_design.method && (
              <div><strong>方法：</strong>{data.experiment_design.method}</div>
            )}
            {data.experiment_design.expected_results && (
              <div><strong>预期结果：</strong>{data.experiment_design.expected_results}</div>
            )}
          </div>
        </div>
      )}
      {data.recipe && (
        <div className="experiment-section">
          <strong>实验配方：</strong>
          <div className="experiment-recipe">{data.recipe}</div>
        </div>
      )}
    </div>
  );
}

// 渲染包含 LaTeX 公式的文本
function renderTextWithFormulas(text: string) {
  if (!text) return null;
  
  // 匹配 $$...$$ (块级公式) 和 $...$ (行内公式)
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  
  // 先处理块级公式 $$...$$
  const blockRegex = /\$\$([^$]+)\$\$/g;
  let match;
  const blockMatches: Array<{ start: number; end: number; formula: string }> = [];
  
  while ((match = blockRegex.exec(text)) !== null) {
    blockMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      formula: match[1].trim()
    });
  }
  
  // 再处理行内公式 $...$，但要排除已经被块级公式匹配的部分
  const inlineRegex = /\$([^$\n]+)\$/g;
  const inlineMatches: Array<{ start: number; end: number; formula: string }> = [];
  
  while ((match = inlineRegex.exec(text)) !== null) {
    // 检查是否在块级公式范围内
    const isInBlock = blockMatches.some(block => 
      match!.index >= block.start && match!.index < block.end
    );
    if (!isInBlock) {
      inlineMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        formula: match[1].trim()
      });
    }
  }
  
  // 合并所有匹配并按位置排序
  const allMatches = [
    ...blockMatches.map(m => ({ ...m, isBlock: true })),
    ...inlineMatches.map(m => ({ ...m, isBlock: false }))
  ].sort((a, b) => a.start - b.start);
  
  // 构建渲染结果
  allMatches.forEach((match) => {
    // 添加公式前的文本
    if (match.start > lastIndex) {
      const beforeText = text.substring(lastIndex, match.start);
      if (beforeText) {
        parts.push(<span key={`text-${key++}`}>{beforeText}</span>);
      }
    }
    
    // 添加公式
    try {
      if (match.isBlock) {
        parts.push(
          <div key={`formula-${key++}`} style={{ margin: '1rem 0', textAlign: 'center' }}>
            <BlockMath math={match.formula} />
          </div>
        );
      } else {
        parts.push(<InlineMath key={`formula-${key++}`} math={match.formula} />);
      }
    } catch (error) {
      // 如果公式解析失败，显示原始文本
      console.warn('公式解析失败:', match.formula, error);
      parts.push(<span key={`formula-${key++}`} style={{ color: '#ef4444' }}>${match.formula}$</span>);
    }
    
    lastIndex = match.end;
  });
  
  // 添加剩余的文本
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(<span key={`text-${key++}`}>{remainingText}</span>);
    }
  }
  
  // 如果没有匹配到任何公式，直接返回原始文本
  if (parts.length === 0) {
    return <span>{text}</span>;
  }
  
  return <>{parts}</>;
}

// 理论分析展示组件
function TheoryDisplay({ data }: { data: any }) {
  return (
    <div className="result-theory">
      {data._streaming && (
        <div className="result-streaming-banner">
          <div className="remake-spinner" aria-hidden="true" />
          <span>流式输出中…（分析正文生成后将继续补全公式与推导步骤）</span>
        </div>
      )}
      {data.analysis && (
        <div className="theory-section">
          <strong>理论分析：</strong>
          <div className="theory-analysis">
            {renderTextWithFormulas(data.analysis)}
          </div>
        </div>
      )}
      {data.formulas && data.formulas.length > 0 && (
        <div className="theory-section">
          <strong>公式：</strong>
          <ul className="theory-formulas">
            {data.formulas.map((formula: string, idx: number) => (
              <li key={idx} className="formula-item">
                {renderTextWithFormulas(formula)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.derivation_steps && data.derivation_steps.length > 0 && (
        <div className="theory-section">
          <strong>推导步骤：</strong>
          <ol className="theory-steps">
            {data.derivation_steps.map((step: string, idx: number) => (
              <li key={idx}>{renderTextWithFormulas(step)}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function IntroductionRemakeDisplay({ data }: { data: any }) {
  const meta = data.literature_pool_meta || {};
  return (
    <div className="result-introduction-remake" style={{ fontSize: '0.9rem', lineHeight: 1.55 }}>
      {data._streaming && (
        <div className="result-streaming-banner">
          <div className="remake-spinner" aria-hidden="true" />
          <span>流式输出中…（重写正文完成后将补全引用列表与审计）</span>
        </div>
      )}
      <div style={{ marginBottom: '0.75rem' }}>
        <strong>Introduction 顶刊重写</strong>
        {(data.search_topic || data.min_publication_year) && (
          <div style={{ marginTop: '0.35rem', color: '#64748b', fontSize: '0.85rem' }}>
            检索主题: {data.search_topic || '—'}
            {data.min_publication_year ? ` · 文献年份 ≥ ${data.min_publication_year}` : ''}
            {meta.raw_scanned != null ? ` · 扫描原始结果 ${meta.raw_scanned} 条` : ''}
          </div>
        )}
      </div>

      {data.allowed_journals?.length > 0 && (
        <details style={{ marginBottom: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>顶刊白名单（{data.allowed_journals.length} 组期刊）</summary>
          <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
            {data.allowed_journals.map((j: any, i: number) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                {j.label}
              </li>
            ))}
          </ul>
        </details>
      )}

      {data.literature_pool?.length > 0 && (
        <details style={{ marginBottom: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            文献池（{data.literature_pool.length} 篇，均为白名单期刊；编号为检索池内序号，与正文顺序引用 [1][2]… 不同）
          </summary>
          <ol style={{ margin: '0.5rem 0 0 1rem', maxHeight: '240px', overflowY: 'auto' }}>
            {data.literature_pool.map((p: any) => (
              <li key={p.pool_index} style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>池#{p.pool_index}</span> {p.title}
                <div style={{ color: '#64748b', fontSize: '0.82rem' }}>
                  {p.venue} · {p.year}
                  {p.doi ? ` · doi:${p.doi}` : ''}
                </div>
              </li>
            ))}
          </ol>
        </details>
      )}

      {data.continuity_notes && (
        <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#f1f5f9', borderRadius: '6px' }}>
          <strong>衔接说明：</strong>
          <div style={{ marginTop: '0.25rem' }}>{data.continuity_notes}</div>
        </div>
      )}

      {data.original_introduction && (
        <details style={{ marginBottom: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>原始 Introduction</summary>
          <pre style={{ whiteSpace: 'pre-wrap', margin: '0.5rem 0 0', fontSize: '0.82rem' }}>{data.original_introduction}</pre>
        </details>
      )}

      {data.remade_introduction && (
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>重写后 Introduction</strong>
          <div style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>{data.remade_introduction}</div>
        </div>
      )}

      {data.references?.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>文中引用文献（与正文 [1][2]… 顺序一致）</strong>
          <ol style={{ margin: '0.35rem 0 0 1rem' }}>
            {data.references.map((r: any, i: number) => {
              const n = r.reference_number ?? i + 1;
              return (
                <li key={i} style={{ marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>[{n}]</span> {r.citation || r.title}
                  {r.pool_index != null && (
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}> · 池内编号 {r.pool_index}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {data.original_reference_audit?.length > 0 && (
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>原文引用审计</summary>
          <ul style={{ margin: '0.5rem 0 0 1rem' }}>
            {data.original_reference_audit.map((a: any, i: number) => (
              <li key={i} style={{ marginBottom: '0.35rem' }}>
                <strong>{a.action || '—'}</strong>: {a.issue || a.detail || JSON.stringify(a)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// 全文检查展示组件
function OverallCheckDisplay({ data }: { data: any }) {
  return (
    <div className="result-overall">
      {data.issues && data.issues.length > 0 && (
        <div className="overall-section">
          <strong>发现的问题：</strong>
          <ul className="overall-issues">
            {data.issues.map((issue: any, idx: number) => (
              <li key={idx} className={`issue-item issue-${issue.severity || 'medium'}`}>
                <span className="issue-location">{issue.location}</span>
                <span className="issue-description">{issue.description}</span>
                {issue.suggestion && (
                  <span className="issue-suggestion">建议：{issue.suggestion}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.suggestions && data.suggestions.length > 0 && (
        <div className="overall-section">
          <strong>改进建议：</strong>
          <ul className="overall-suggestions">
            {data.suggestions.map((suggestion: string, idx: number) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 实验提取展示组件
function ExperimentExtractDisplay({ data, onUseForVisualization }: { data: any; onUseForVisualization?: (text: string) => void }) {
  return (
    <div className="result-experiment-extract">
      {data.confidence && (
        <div className="extract-confidence">
          <strong>提取置信度：</strong>
          <span className={`confidence-${data.confidence}`}>{data.confidence}</span>
        </div>
      )}
      {data.summary && (
        <div className="extract-summary">
          <strong>摘要：</strong>
          <div className="summary-text">{data.summary}</div>
        </div>
      )}
      {data.experiment_text && (
        <div className="extract-steps">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong>提取的实验步骤：</strong>
            {onUseForVisualization && (
              <button
                onClick={() => onUseForVisualization(data.experiment_text)}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="使用此文本进行可视化"
              >
                📊 可视化此步骤
              </button>
            )}
          </div>
          <div className="steps-text">
            <pre>{data.experiment_text}</pre>
          </div>
        </div>
      )}
      {data.sections && data.sections.length > 0 && (
        <div className="extract-sections">
          <strong>识别的章节：</strong>
          <ul className="sections-list">
            {data.sections.map((section: any, idx: number) => (
              <li key={idx} className="section-item">
                <span className="section-name">{section.section_name || '未知章节'}</span>
                <span className={`section-confidence confidence-${section.confidence || 'low'}`}>
                  {section.confidence || 'low'}
                </span>
                {section.content && (
                  <div className="section-content">{section.content.substring(0, 200)}...</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 实验可视化展示组件
function ExperimentVisualizeDisplay({ data, onRecipeFromOperations }: { data: any; onRecipeFromOperations?: (operations: any[]) => void }) {
  const { operations, stats } = data;
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'both'>('2d');
  
  const operationLabels: Record<string, { label: string; color: string }> = {
    add: { label: '加入', color: '#10b981' },
    extract: { label: '提取', color: '#f59e0b' },
    heat: { label: '加热', color: '#ef4444' },
    cool: { label: '冷却', color: '#3b82f6' },
    stir: { label: '搅拌', color: '#8b5cf6' },
    field: { label: '外场', color: '#ec4899' }
  };
  
  if (!operations || operations.length === 0) {
    return (
      <div className="result-experiment-visualize">
        <div className="visualize-empty">暂无操作数据</div>
      </div>
    );
  }
  
  return (
    <div className="result-experiment-visualize">
      {/* 操作按钮 */}
      {onRecipeFromOperations && operations && operations.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onRecipeFromOperations(operations)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}
            title="将当前operations转写为机器配方"
          >
            🤖 转写机器配方
          </button>
        </div>
      )}
      
      {/* 统计信息卡片 */}
      {stats && stats.total !== undefined && (
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">总步骤数</div>
          </div>
          {stats.by_type && Object.entries(stats.by_type).map(([type, count]: [string, any]) => {
            const info = operationLabels[type] || { label: type, color: '#64748b' };
            return (
              <div key={type} className="stat-item" style={{ borderTop: `3px solid ${info.color}` }}>
                <div className="stat-value" style={{ color: info.color }}>{count}</div>
                <div className="stat-label">{info.label}</div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 视图切换 */}
      <div className="view-toggle-bar">
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            🎨 2D 符号
          </button>
          <button 
            className={`view-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            🧊 3D 视图
          </button>
          <button 
            className={`view-btn ${viewMode === 'both' ? 'active' : ''}`}
            onClick={() => setViewMode('both')}
          >
            📊 双视图
          </button>
        </div>
      </div>
      
      {/* 可视化区域 */}
      <div className={`visualization-layout ${viewMode}`}>
        {(viewMode === '2d' || viewMode === 'both') && (
          <div className="viz-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>🎨 符号化时间线</h3>
            <SymbolTimeline operations={operations} />
          </div>
        )}
        
        {(viewMode === '3d' || viewMode === 'both') && (
          <div className="viz-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>🧊 3D 结构视图</h3>
            <ErrorBoundary fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>3D 视图加载失败，请使用 2D 视图</div>}>
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>加载 3D 视图...</div>}>
                <ThreeDView operations={operations} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </div>
      
      {/* 操作详情列表 */}
      <div className="details-card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>📋 操作详情</h3>
        <div className="operations-timeline">
          {operations.map((op: any, idx: number) => {
            const info = operationLabels[op.type] || { label: op.type, color: '#64748b' };
            return (
              <div key={idx} className="timeline-item">
                <div className="timeline-marker" style={{ background: info.color }}>
                  {idx + 1}
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-type" style={{ color: info.color }}>
                      {info.label}
                    </span>
                    {op.time && <span className="timeline-time">{op.time}</span>}
                  </div>
                  <div className="timeline-details">
                    {op.substance && <span>物质: {op.substance}</span>}
                    {op.state && <span>状态: {op.state}</span>}
                    {op.amount && <span>用量: {op.amount}</span>}
                    {op.temperature && <span>温度: {op.temperature}</span>}
                    {op.name && <span>名称: {op.name}</span>}
                    {op.description && <span>描述: {op.description}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 默认展示组件
function DefaultDisplay({ data }: { data: any }) {
  return (
    <div className="result-default">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
