export type UserScatterSeries = {
  x: number[];
  y: number[];
  label?: string;
};

/** 单次上传的一条实验曲线 */
export type UserLifeEntry = {
  id: string;
  scatter: UserScatterSeries;
  fileName: string;
  /** 测试温度 ℃（任意数值） */
  tempC: number;
  /** 散点颜色，与该行表格一致 */
  color: string;
};
