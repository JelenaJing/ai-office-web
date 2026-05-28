/** 每条上传实验曲线的散点颜色（与预测红黑线区分） */
export const EXPERIMENT_SCATTER_PALETTE = [
  "#6366f1",
  "#0891b2",
  "#16a34a",
  "#ca8a04",
  "#c026d3",
  "#ea580c",
  "#4338ca",
  "#0d9488",
  "#a855f7",
  "#b91c1c"
];

export function experimentScatterColor(index: number): string {
  return EXPERIMENT_SCATTER_PALETTE[index % EXPERIMENT_SCATTER_PALETTE.length]!;
}
