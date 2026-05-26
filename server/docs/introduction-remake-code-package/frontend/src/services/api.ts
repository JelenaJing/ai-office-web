/**
 * API客户端
 */
import axios from 'axios';

// 优先使用环境变量，如果没有则使用相对路径（通过vite代理）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/** SSE: POST remake 流式接口（event: meta | delta | done | error） */
export type SseRemakeHandlers = {
  onMeta?: (data: Record<string, unknown>) => void;
  onDelta?: (text: string) => void;
  onDone?: (data: Record<string, unknown>) => void;
  onError?: (message: string) => void;
};

function processSseBuffer(buffer: string, handlers: SseRemakeHandlers): string {
  const sep = '\n\n';
  let rest = buffer;
  let idx: number;
  while ((idx = rest.indexOf(sep)) >= 0) {
    const block = rest.slice(0, idx);
    rest = rest.slice(idx + sep.length);
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5));
    }
    const raw = dataLines.join('\n');
    if (event === 'meta') {
      try {
        handlers.onMeta?.(JSON.parse(raw));
      } catch {
        handlers.onMeta?.({ raw } as Record<string, unknown>);
      }
    } else if (event === 'delta') {
      handlers.onDelta?.(raw);
    } else if (event === 'done') {
      try {
        handlers.onDone?.(JSON.parse(raw));
      } catch {
        handlers.onDone?.({ raw } as Record<string, unknown>);
      }
    } else if (event === 'error') {
      handlers.onError?.(raw);
    }
  }
  return rest;
}

export async function streamRemakeSse(
  path: string,
  body: object,
  handlers: SseRemakeHandlers,
  options?: { timeoutMs?: number }
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 1_800_000;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  const base = API_BASE_URL || '';
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const t = await res.text();
      handlers.onError?.(t || res.statusText || `HTTP ${res.status}`);
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) {
      handlers.onError?.('No response body');
      return;
    }
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      buf = processSseBuffer(buf, handlers);
    }
    if (buf.trim()) {
      processSseBuffer(buf + '\n\n', handlers);
    }
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    if (err?.name === 'AbortError') handlers.onError?.('请求超时');
    else handlers.onError?.(err?.message || String(e));
  } finally {
    clearTimeout(tid);
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 添加超时配置
  timeout: 60000, // 60秒超时，文件上传可能需要更长时间
});

// 论文相关API
export const paperAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/paper/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProject: async (projectId: string) => {
    const response = await api.get(`/api/v1/paper/${projectId}`);
    return response.data;
  },

  getContent: async (projectId: string) => {
    const response = await api.get(`/api/v1/paper/${projectId}/content`);
    return response.data;
  },

  listProjects: async () => {
    const response = await api.get('/api/v1/paper/');
    return response.data;
  },

  listFiles: async (projectId: string, path: string = '') => {
    const response = await api.get(`/api/v1/paper/${projectId}/files`, {
      params: { path },
    });
    return response.data;
  },

  getFile: async (projectId: string, filePath: string) => {
    const response = await api.get(`/api/v1/paper/${projectId}/files/${filePath}`);
    return response.data;
  },

  downloadFile: (projectId: string, filePath: string) => {
    // 使用相对路径或完整URL
    const base = API_BASE_URL || '';
    return `${base}/api/v1/paper/${projectId}/files/${filePath}/download`;
  },
};

// Remake相关API
export const remakeAPI = {
  generateIdea: async (projectId: string, selectedText: string, context?: string) => {
    const response = await api.post('/api/v1/remake/idea', {
      project_id: projectId,
      selected_text: selectedText,
      context,
    });
    return response.data;
  },

  checkContent: async (projectId: string, selectedText: string) => {
    const response = await api.post('/api/v1/remake/check', {
      project_id: projectId,
      selected_text: selectedText,
    });
    return response.data;
  },

  designExperiment: async (projectId: string, selectedText: string) => {
    const response = await api.post('/api/v1/remake/experiment', {
      project_id: projectId,
      selected_text: selectedText,
    });
    return response.data;
  },

  analyzeTheory: async (projectId: string, selectedText: string) => {
    const response = await api.post('/api/v1/remake/theory', {
      project_id: projectId,
      selected_text: selectedText,
    }, {
      // 设置30分钟超时，支持长时间运行的理论分析任务
      // 如果任务可能超过30分钟，建议后端实现异步任务机制（后台任务+轮询状态）
      timeout: 1800000, // 30分钟（1800秒）
    });
    return response.data;
  },

  checkOverall: async (projectId: string) => {
    const response = await api.post('/api/v1/remake/overall', {
      project_id: projectId,
    });
    return response.data;
  },

  extractExperiment: async (projectId: string, selectedText?: string) => {
    const response = await api.post('/api/v1/remake/extract-experiment', {
      project_id: projectId,
      selected_text: selectedText,
    }, {
      // 设置30分钟超时，支持长时间运行的实验提取任务
      timeout: 1800000, // 30分钟（1800秒）
    });
    return response.data;
  },

  visualizeExperiment: async (projectId: string, experimentSteps: string) => {
    const response = await api.post('/api/v1/remake/visualize-experiment', {
      project_id: projectId,
      experiment_steps: experimentSteps,
    });
    return response.data;
  },

  remakeIntroduction: async (
    projectId: string,
    options?: {
      selectedText?: string;
      context?: string;
      autoExtractIntro?: boolean;
      maxPapersForLlm?: number;
    }
  ) => {
    const response = await api.post(
      '/api/v1/remake/introduction',
      {
        project_id: projectId,
        selected_text: options?.selectedText ?? '',
        context: options?.context,
        auto_extract_intro: options?.autoExtractIntro ?? false,
        max_papers_for_llm: options?.maxPapersForLlm ?? 100,
      },
      {
        timeout: 900000,
      }
    );
    return response.data;
  },

  recipeExperiment: async (projectId: string, operations: any[], options?: {
    formula_name?: string;
    device_number?: string;
    org_number?: string;
    backend_url?: string;
    equipment_type?: number;
  }) => {
    const response = await api.post('/api/v1/remake/recipe-experiment', {
      project_id: projectId,
      operations,
      ...(options || {}),
    });
    return response.data;
  },
};

// 数据相关API
export const dataAPI = {
  generatePlot: async (
    projectId: string | null,
    file: File | null,
    chartType?: string,
    autoRecommend: boolean = true
  ) => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (projectId) {
      formData.append('project_id', projectId);
    }
    if (chartType) {
      formData.append('chart_type', chartType);
    }
    formData.append('auto_recommend', String(autoRecommend));

    const response = await api.post('/api/v1/data/plot', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generatePlotFromJson: async (payload: {
    project_id?: string | null;
    data?: any;
    raw_text?: string;
    chart_type?: string;
    auto_recommend?: boolean;
    style?: string;
    title?: string;
    xlabel?: string;
    ylabel?: string;
    x?: string;
    y?: string;
    hue?: string;
  }) => {
    const response = await api.post('/api/v1/data/plot/json', {
      auto_recommend: true,
      style: 'publication',
      ...(payload || {}),
    });
    return response.data;
  },

  generateSpectralData: async (params?: {
    start_nm?: number;
    end_nm?: number;
    step?: number;
    peak_nm?: number;
    width?: number;
    noise?: number;
  }) => {
    const response = await api.post('/api/v1/data/spectral/generate', params || {});
    return response.data;
  },

  recommendPlotFromJson: async (payload: {
    project_id?: string | null;
    data?: any;
    raw_text?: string;
    top_n?: number;
  }) => {
    const response = await api.post('/api/v1/data/plot/recommend', {
      top_n: 5,
      ...(payload || {}),
    });
    return response.data;
  },

  /** 多图拼合 PNG 写入项目 data/plots（与本地下载并行） */
  saveCollage: async (projectId: string, pngBlob: Blob) => {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', pngBlob, `collage_${Date.now()}.png`);
    const response = await api.post('/api/v1/data/collage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    });
    return response.data;
  },
};

export default api;
