/**
 * 功能侧边栏
 */
import { useState, useEffect, useRef } from 'react';
import { remakeAPI, streamRemakeSse } from '../../services/api';
import type { RemakeType } from '../../types';

interface FunctionPanelProps {
  projectId: string | null;
  selectedText: string;
  onResult?: (type: RemakeType, result: any) => void;
  onPlotClick?: () => void;
  onCollageClick?: () => void;
  /** 同步 Remake 按钮 loading 状态到主布局（用于结果区「生成中」动效） */
  onLoadingChange?: (type: string | null) => void;
}

export default function FunctionPanel({
  projectId,
  selectedText,
  onResult,
  onPlotClick,
  onCollageClick,
  onLoadingChange,
}: FunctionPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [longRunningWarning, setLongRunningWarning] = useState<string | null>(null);
  const loadingStartTimeRef = useRef<number | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 监听长时间运行的任务，显示提示
  useEffect(() => {
    if (loading) {
      loadingStartTimeRef.current = Date.now();
      setLongRunningWarning(null);
      
      // 对于理论分析、实验提取等可能长时间运行的任务，1分钟后显示提示
      const isLongRunningTask = ['theory', 'check', 'extract-experiment', 'introduction'].includes(loading);
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

    // 提取实验、Introduction（可全文自动提取）不需要强制选中文本
    if (
      type !== 'extract-experiment' &&
      type !== 'introduction' &&
      type !== 'visualize-experiment' &&
      !selectedText.trim()
    ) {
      alert('请先选择文本');
      return;
    }

    setLoading(type);

    try {
      let response: unknown;
      switch (type) {
        case 'idea':
          response = await remakeAPI.generateIdea(projectId, selectedText);
          break;
        case 'check': {
          let merged: Record<string, unknown> = {};
          await streamRemakeSse(
            '/api/v1/remake/check/stream',
            { project_id: projectId, selected_text: selectedText },
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
          response = await remakeAPI.designExperiment(projectId, selectedText);
          break;
        case 'theory': {
          let analysis = '';
          await streamRemakeSse(
            '/api/v1/remake/theory/stream',
            { project_id: projectId, selected_text: selectedText },
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
          response = await remakeAPI.extractExperiment(projectId, selectedText || undefined);
          break;
        case 'visualize-experiment':
          // 可视化需要实验步骤文本，如果没有选中文本，提示用户
          if (!selectedText.trim()) {
            alert('请先输入或选择实验步骤文本');
            setLoading(null);
            return;
          }
          response = await remakeAPI.visualizeExperiment(projectId, selectedText);
          break;
        case 'recipe-experiment':
          // Step5需要operations输入，需要从之前的结果中获取
          alert('请先执行"DeepSyn可视化"以获取operations');
          setLoading(null);
          return;
        case 'introduction': {
          let mergedIntro: Record<string, unknown> = {};
          await streamRemakeSse(
            '/api/v1/remake/introduction/stream',
            {
              project_id: projectId,
              selected_text: selectedText.trim(),
              auto_extract_intro: !selectedText.trim(),
              max_papers_for_llm: 100,
            },
            {
              onMeta: (m) => {
                mergedIntro = { ...m, remade_introduction: '', _streaming: true };
                onResult?.('introduction', mergedIntro);
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

  const buttons = [
    { type: 'idea' as RemakeType, label: '生成新科研Idea', icon: '💡' },
    { type: 'check' as RemakeType, label: '检查内容和Reference', icon: '✓' },
    { type: 'experiment' as RemakeType, label: '重新设计实验', icon: '🔬' },
    { type: 'extract-experiment' as any, label: '提取实验内容', icon: '🔍' },
    { type: 'visualize-experiment' as any, label: 'DeepSyn可视化', icon: '📊' },
    { type: 'recipe-experiment' as any, label: '转写机器配方', icon: '🤖' },
    { type: 'theory' as RemakeType, label: '理论分析和公式推导', icon: '📐' },
    { type: 'introduction' as RemakeType, label: 'Introduction顶刊重写', icon: '📝' },
    { type: 'overall' as RemakeType, label: '全文整体检查', icon: '📋' },
  ];

  return (
    <div className="function-panel">
      <h3>Remake功能</h3>
      {longRunningWarning && (
        <div style={{
          padding: '10px',
          margin: '10px 0',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          color: '#856404',
          fontSize: '14px'
        }}>
          ⏳ {longRunningWarning}
        </div>
      )}
      <div className="selected-text">
        <strong>选中文本：</strong>
        <div className="text-preview">{selectedText || '未选择文本'}</div>
      </div>
      <div className="function-buttons">
        {buttons.map((btn) => {
          // 提取实验不需要选中文本，可视化实验需要
          const needsText =
            btn.type !== 'extract-experiment' &&
            btn.type !== 'introduction' &&
            btn.type !== 'overall' &&
            btn.type !== 'recipe-experiment';

          const isDisabled =
            !projectId ||
            (needsText && !selectedText.trim()) ||
            loading !== null;
          
          return (
          <button
            key={btn.type}
            onClick={() => handleRemake(btn.type)}
              disabled={isDisabled}
            className={loading === btn.type ? 'loading' : ''}
          >
            {btn.icon} {btn.label}
          </button>
          );
        })}
        {/* 画图按钮 */}
        <button
          onClick={() => onPlotClick?.()}
          disabled={!projectId || loading !== null}
          className="function-plot-btn"
        >
          🎨 画图工具
        </button>
        <button
          onClick={() => onCollageClick?.()}
          disabled={!projectId || loading !== null}
          className="function-collage-btn"
        >
          🖼 多图组合
        </button>
      </div>
    </div>
  );
}
