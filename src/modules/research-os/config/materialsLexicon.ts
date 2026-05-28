/** 材料科研 OS 统一中文文案 */
export const LEX = {
  productName: '材料科研 OS',
  tagline: '一个平台 · 零代码 · 材料数字化孪生',
  modeBuilder: '材料装配',
  modeSimulator: '实验仿真',
  hubTitle: '材料科研 OS',
  hubSubtitle: '叠层装配复合材料 → 配置实验数据流 → 运行工艺仿真 → 过程监控',
  settings: '设置',
  save: '保存',
  load: '加载',
  dashboard: '工作台',
  overview: '课题总览',
  metadata: '课题信息',
  connections: '蓝图设计',
  descriptor: '方案描述',
  scatterLayout: '自动排布',
  allTypes: '全部类型',
  allStatus: '全部状态',
  simulate: '运行仿真',
  deploy: '发布方案',
  runtime: '过程监控',
  edit: '编辑',
  editDone: '完成编辑',
  apiKey: '接口密钥',
  undo: '撤销',
  redo: '重做',
  connectionNew: '新建连线',
  connectionTotal: (n: number, incomplete: number) => `${n} 条连线 · ${incomplete} 条待完成`,
  noConnections: '暂无连线，请在画布上拖拽端口建立数据流',
  device: '数据源',
  control: '处理单元',
  interfaces: '数据接口',
  signalAnalog: '模拟量',
  signalDigital: '数字量',
  signalControl: '控制量',
  stage: '阶段',
} as const

export const SIDEBAR_DEVICE_TEMPLATES = [
  { title: '实验数据接入', modelId: 'Lab-CSV-v1', kind: 'device' as const },
  { title: '谱图采集仪', modelId: 'Spectrum-Ingest-v1', kind: 'device' as const },
  { title: '性能预测服务', modelId: 'Property-Predict-v1', kind: 'device' as const },
] as const

export const SIDEBAR_CONTROL_TEMPLATES = [
  { title: '数据归一化', modelId: 'Transform-Normalize', kind: 'control' as const },
  { title: '配方优化器', modelId: 'Formulation-Opt-v1', kind: 'control' as const },
] as const
