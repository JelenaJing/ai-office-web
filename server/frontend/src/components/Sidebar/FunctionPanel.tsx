/**
 * 功能侧边栏
 */
import { useState, useEffect, useRef } from 'react';
import { paperAPI, remakeAPI, streamRemakeSse } from '../../services/api';
import type { RemakeType } from '../../types';

interface FunctionPanelProps {
  projectId: string | null;
  selectedText: string;
  onResult?: (type: RemakeType, result: any) => void;
  onPlotClick?: () => void;
  onCollageClick?: () => void;
  onInsertReference?: () => Promise<void>;
  /** 同步 Remake 按钮 loading 状态到主布局（用于结果区「生成中」动效） */
  onLoadingChange?: (type: string | null) => void;
}

export default function FunctionPanel({
  projectId,
  selectedText,
  onResult,
  onPlotClick,
  onCollageClick,
  onInsertReference,
  onLoadingChange,
}: FunctionPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [longRunningWarning, setLongRunningWarning] = useState<string | null>(null);
  const loadingStartTimeRef = useRef<number | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getFullTextInput = async (): Promise<string> => {
    if (!projectId) throw new Error('请先选择项目');
    const content = await paperAPI.getContent(projectId);
    const fullText = String(content?.text || content?.content || '');
    const trimmed = fullText.trim();
    if (!trimmed) throw new Error('未能读取到全文内容');
    return trimmed;
  };

  const resolveInputText = async (type: RemakeType): Promise<string> => {
    const sel = (selectedText || '').trim();
    if (sel) return sel;
    // For these tasks, allow defaulting to full paper text
    if (type === 'idea' || type === 'experiment' || type === 'theory' || type === 'check') {
      return await getFullTextInput();
    }
    return '';
  };

  // 监听长时间运行的任务，显示提示
  useEffect(() => {
    if (loading) {
      loadingStartTimeRef.current = Date.now();
      setLongRunningWarning(null);
      
      // 对于理论分析、实验提取等可能长时间运行的任务，1分钟后显示提示
      const isLongRunningTask = ['theory', 'check', 'extract-experiment', 'introduction', 'full-paper-remake'].includes(
        loading
      );
      if (isLongRunningTask) {
        warningTimerRef.current = setTimeout(() => {
          setLongRunningWarning('任务正在处理中，可能需要较长时间，请耐心等待...');
        }, 60000); // 1分钟后显示提示
      }
    } else {
      // 清理定时器
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      loadingStartTimeRef.current = null;
      setLongRunningWarning(null);
    }
    
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [loading]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const handleRemake = async (type: RemakeType) => {
    if (!projectId) {
      alert('请先选择项目');
      return;
    }

    // 默认输入：优先选中文本；部分任务支持无选中时自动用全文（分段多轮，覆盖全文）
    let inputText = '';
    try {
      inputText = await resolveInputText(type);
    } catch (e: any) {
      alert(`读取全文失败: ${e?.message || '未知错误'}`);
      return;
    }
    const usedFullText = !(selectedText || '').trim() && (type === 'idea' || type === 'experiment' || type === 'theory' || type === 'check');
    if (
      !inputText &&
      type !== 'extract-experiment' &&
      type !== 'introduction' &&
      type !== 'overall' &&
      type !== 'recipe-experiment' &&
      type !== 'full-paper-remake'
    ) {
      // visualize-experiment expects experiment steps, not raw paper text
      if (type === 'visualize-experiment') {
        alert('请先输入或选择实验步骤文本');
      } else {
        alert('请先选择文本（或使用支持“全文输入”的按钮）');
      }
      return;
    }

    setLoading(type);

    try {
      let response: unknown;
      switch (type) {
        case 'idea':
          if (usedFullText) {
            response = await remakeAPI.generateIdeaFulltext(projectId);
            break;
          }
          response = await remakeAPI.generateIdea(projectId, inputText);
          break;
        case 'check': {
          if (usedFullText) {
            response = await remakeAPI.checkContentFulltext(projectId);
            break;
          }
          let merged: Record<string, unknown> = {};
          await streamRemakeSse(
            '/api/v1/remake/check/stream',
            { project_id: projectId, selected_text: inputText },
            {
              onMeta: (m) => {
                merged = {
                  status: 'success',
                  message: '内容检查生成中…',
                  original_text: m.original_text,
                  issues: m.issues ?? [],
                  updated_references: m.updated_references ?? [],
                  recommended_references: m.recommended_references ?? [],
                  updated_text: '',
                  is_outdated: m.is_outdated,
                  latest_papers_count: m.latest_papers_count,
                  matched_count: m.matched_count,
                  data: {
                    is_outdated: m.is_outdated,
                    latest_papers_count: m.latest_papers_count,
                    recommended_references: m.recommended_references,
                  },
                  _streaming: true,
                };
                onResult?.('check', merged);
              },
              onDelta: (t) => {
                const prev = (merged.updated_text as string) || '';
                merged = { ...merged, updated_text: prev + t, _streaming: true };
                onResult?.('check', { ...merged });
              },
              onDone: (d) => {
                onResult?.('check', { ...d, _streaming: false });
              },
              onError: (msg) => {
                throw new Error(msg);
              },
            }
          );
          response = null;
          break;
        }
        case 'experiment':
          if (usedFullText) {
            response = await remakeAPI.designExperimentFulltext(projectId);
            break;
          }
          response = await remakeAPI.designExperiment(projectId, inputText);
          break;
        case 'theory': {
          if (usedFullText) {
            response = await remakeAPI.analyzeTheoryFulltext(projectId);
            break;
          }
          let analysis = '';
          await streamRemakeSse(
            '/api/v1/remake/theory/stream',
            { project_id: projectId, selected_text: inputText },
            {
              onDelta: (t) => {
                analysis += t;
                onResult?.('theory', {
                  status: 'success',
                  message: '理论分析生成中…',
                  analysis,
                  formulas: [],
                  derivation_steps: [],
                  _streaming: true,
                });
              },
              onDone: (d) => {
                onResult?.('theory', { ...d, _streaming: false });
              },
              onError: (msg) => {
                throw new Error(msg);
              },
            }
          );
          response = null;
          break;
        }
        case 'overall':
          response = await remakeAPI.checkOverall(projectId);
          break;
        case 'extract-experiment':
          response = await remakeAPI.extractExperiment(projectId, inputText || undefined);
          break;
        case 'visualize-experiment':
          response = await remakeAPI.visualizeExperiment(projectId, inputText);
          break;
        case 'recipe-experiment':
          // Step5需要operations输入，需要从之前的结果中获取
          alert('请先执行"DeepSyn可视化"以获取operations');
          setLoading(null);
          return;
        case 'full-paper-remake': {
          let mergedPaper: Record<string, unknown> = {
            markdown: '',
            errors: [] as unknown[],
            sections: {},
            _streaming: true,
            _fullPaper: true,
            _streamingSection: null as string | null,
          };
          await streamRemakeSse(
            '/api/v1/remake/full-paper-remake/stream',
            {
              project_id: projectId,
              force_reclean: false,
              max_papers_for_llm: 72,
              target_chars: 6000,
              overlap_chars: 300,
            },
            {
              onMeta: (m) => {
                const st = typeof m.stage === 'string' ? m.stage : '';
                let sec: string | null =
                  st === 'streaming_section' && typeof m.section === 'string' ? m.section : null;
                if (sec === null) {
                  if (st === 'cleaning') sec = 'cleaning';
                  else if (st === 'parallel_start') sec = 'parallel';
                  else if (st === 'parallel_complete') sec = 'parallel_done';
                  else if (st === 'assembly_complete') sec = null;
                }
                mergedPaper = {
                  ...mergedPaper,
                  ...m,
                  _streaming: true,
                  _fullPaper: true,
                  _streamingSection: sec ?? (mergedPaper._streamingSection as string | null),
                };
                onResult?.('full-paper-remake', mergedPaper);
              },
              onDelta: (t) => {
                const prev = (mergedPaper.markdown as string) || '';
                mergedPaper = {
                  ...mergedPaper,
                  markdown: prev + t,
                  _streaming: true,
                  _fullPaper: true,
                };
                onResult?.('full-paper-remake', { ...mergedPaper });
              },
              onDone: (d) => {
                onResult?.('full-paper-remake', {
                  ...d,
                  _streaming: false,
                  _fullPaper: true,
                  _streamingSection: null,
                });
              },
              onError: (msg) => {
                throw new Error(msg);
              },
            },
            { timeoutMs: 1_800_000 }
          );
          response = null;
          break;
        }
        case 'introduction': {
          let mergedIntro: Record<string, unknown> = {};
          await streamRemakeSse(
            '/api/v1/remake/introduction/stream',
            {
              project_id: projectId,
              selected_text: (selectedText || '').trim(),
              auto_extract_intro: !(selectedText || '').trim(),
              max_papers_for_llm: 100,
            },
            {
              onMeta: (m) => {
                // 保留已积累的 remade_introduction，只合并新 meta 字段
                const prevText = (mergedIntro.remade_introduction as string) || '';
                mergedIntro = { ...mergedIntro, ...m, remade_introduction: prevText, _streaming: true };
                onResult?.('introduction', { ...mergedIntro });
              },
              onDelta: (t) => {
                const prev = (mergedIntro.remade_introduction as string) || '';
                mergedIntro = { ...mergedIntro, remade_introduction: prev + t, _streaming: true };
                onResult?.('introduction', { ...mergedIntro });
              },
              onDone: (d) => {
                onResult?.('introduction', { ...d, _streaming: false });
              },
              onError: (msg) => {
                throw new Error(msg);
              },
            },
            { timeoutMs: 1_800_000 }
          );
          response = null;
          break;
        }
      }
      if (response != null) {
        onResult?.(type, response);
      }
    } catch (error: any) {
      console.error(`${type} 操作失败:`, error);
      // 提供更详细的错误信息
      let errorMessage = '操作失败';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // 超时错误
        const elapsedTime = loadingStartTimeRef.current 
          ? Math.round((Date.now() - loadingStartTimeRef.current) / 1000)
          : 0;
        errorMessage = `请求超时（已运行 ${elapsedTime} 秒）。任务可能仍在后端处理中，请稍后检查结果文件，或考虑实现异步任务机制。`;
      } else if (error.response) {
        // 服务器返回了错误响应
        errorMessage = error.response.data?.detail || error.response.data?.message || error.response.statusText || '服务器错误';
      } else if (error.request) {
        // 请求已发出但没有收到响应
        if (error.message?.includes('ERR_EMPTY_RESPONSE')) {
          errorMessage = '连接中断：服务器可能仍在处理中。如果任务运行时间较长，请稍后检查结果文件，或考虑实现异步任务机制。';
        } else {
          errorMessage = '网络错误：无法连接到服务器，请检查后端服务是否正常运行';
        }
      } else {
        // 其他错误
        errorMessage = error.message || '未知错误';
      }
      alert(`操作失败: ${errorMessage}`);
    } finally {
      setLoading(null);
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      loadingStartTimeRef.current = null;
    }
  };

  const handleExtractThenVisualize = async () => {
    if (!projectId) {
      alert('请先选择项目');
      return;
    }
    setLoading('extract-experiment');
    try {
      const input = (selectedText || '').trim() || (await getFullTextInput());
      const combined = await remakeAPI.extractThenVisualizeExperiment(projectId, input || undefined);
      onResult?.('visualize-experiment', combined);
    } catch (e: any) {
      alert(`实验链路失败: ${e?.message || '未知错误'}`);
    } finally {
      setLoading(null);
    }
  };

  const groups: Array<{
    id: string;
    title: string;
    hint?: string;
    buttons: Array<{ type: RemakeType; label: string; icon: string; title?: string }>;
  }> = [
    {
      id: 'writing',
      title: '写作与生成',
      buttons: [
        { type: 'idea' as RemakeType, label: '生成新科研Idea', icon: '💡' },
        { type: 'full-paper-remake' as RemakeType, label: '全文 CoRemake', icon: '📄' },
        { type: 'introduction' as RemakeType, label: 'Introduction重写', icon: '📝' },
        { type: 'theory' as RemakeType, label: '理论分析和公式推导', icon: '📐' },
      ],
    },
    {
      id: 'experiment',
      title: '实验链路（提取 → 可视化 → 配方）',
      hint: '建议按顺序使用',
      buttons: [
        // 合并按钮：提取 + 可视化（串行输出）
        { type: 'extract-experiment' as any, label: '提取实验内容 + DeepSyn可视化', icon: '🔗' },
        { type: 'recipe-experiment' as any, label: '转写机器配方', icon: '🤖' },
        {
          type: 'experiment' as RemakeType,
          label: '重新设计实验',
          icon: '🔬',
          title:
            '未选中文本时：先自动从全文提取方法/实验部分，再重新设计。若选中了 PDF 文本，则仅以选中内容为准（请尽量选中 Methods / 实验步骤相关段落）。',
        },
      ],
    },
  ];

  return (
    <div className="function-panel">
      <h3>Remake功能</h3>
      {longRunningWarning && (
        <div className="function-panel-warning" role="status">
          ⏳ {longRunningWarning}
        </div>
      )}
      <div className="function-panel-section">
        <div className="selected-text" style={{ marginBottom: 0 }}>
          <strong>选中文本：</strong>
          <div className="text-preview">{selectedText || '未选择文本'}</div>
        </div>
      </div>

      <div className="function-panel-section">
        <div className="function-panel-section-title">Reference 工具</div>
        <div className="function-buttons">
          <button
            onClick={async () => {
              if (!projectId) {
                alert('请先选择项目');
                return;
              }
              if (!onInsertReference) {
                alert('插入 reference 功能未接入');
                return;
              }
              setLoading('check');
              try {
                await onInsertReference();
              } catch (error: any) {
                alert(`插入 reference 失败: ${error?.message || '未知错误'}`);
              } finally {
                setLoading(null);
              }
            }}
            disabled={!projectId || loading !== null}
            className="function-plot-btn"
            title="读取全文并自动搜集/插入 reference"
          >
            📚 全文插入 Reference
          </button>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.id} className="function-panel-section">
          <div className="function-panel-section-head">
            <div className="function-panel-section-title">{g.title}</div>
            {g.hint && <div className="function-panel-section-hint" style={{ margin: 0 }}>{g.hint}</div>}
          </div>
          <div className="function-buttons">
            {g.buttons.map((btn) => {
              const needsText = false; // now: supported tasks will auto-use full text if no selection

              const isDisabled = !projectId || (needsText && !selectedText.trim()) || loading !== null;
              return (
                <button
                  key={btn.type}
                  title={btn.title}
                  onClick={() => {
                    if (btn.label.includes('提取实验内容 + DeepSyn可视化')) {
                      handleExtractThenVisualize();
                      return;
                    }
                    handleRemake(btn.type);
                  }}
                  disabled={isDisabled}
                  className={loading === btn.type ? 'loading' : ''}
                >
                  {btn.icon} {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="function-panel-section">
        <div className="function-panel-section-title">图表与排版</div>
        <div className="function-buttons">
          <button onClick={() => onPlotClick?.()} disabled={!projectId || loading !== null} className="function-plot-btn">
            🎨 画图工具
          </button>
          <button onClick={() => onCollageClick?.()} disabled={!projectId || loading !== null} className="function-collage-btn">
            🖼 多图组合
          </button>
        </div>
      </div>
    </div>
  );
}
