/** 下拉显示名：化学名 +（单位），与后端 formulation 字段 key 对齐 */
export const COMPONENT_LABEL_BY_KEY: Record<string, string> = {
  PF6: "PF6 / LiPF6 (M)",
  FSI: "FSI / LiFSI (M)",
  VC: "VC (vol parts)",
  FEC: "FEC (vol parts)",
  MMDS: "MMDS (vol parts)",
  TMSP: "TMSP (vol parts)",
  DDSI: "DDSI (vol parts)"
};

export function labelForComponentKey(key: string): string {
  return COMPONENT_LABEL_BY_KEY[key] ?? key;
}
