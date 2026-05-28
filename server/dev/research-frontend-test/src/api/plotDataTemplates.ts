import { getApiEntryMode, researchFetch, researchJson } from './apiBase'

export interface PlotDataTemplate {
  data_type: string
  label: string
  description: string
  template_id: string
  chart_type: string
  chart_type_label: string
  axis_summary: string
}

/** Fallback when catalog API unavailable (matches template_registry.json). */
export const PLOT_DATA_TEMPLATES_FALLBACK: PlotDataTemplate[] = [
  {
    data_type: 'xrd_pattern',
    label: 'XRD 衍射谱',
    description: '2θ – 强度',
    template_id: 'xrd_line',
    chart_type: 'line',
    chart_type_label: '折线图',
    axis_summary: '2-Theta (deg) – Intensity',
  },
  {
    data_type: 'pl_spectrum',
    label: '光致发光 PL',
    description: '波长 – PL 强度',
    template_id: 'pl_line',
    chart_type: 'line',
    chart_type_label: '折线图',
    axis_summary: 'Wavelength (nm) – PL Intensity',
  },
  {
    data_type: 'raman_spectrum',
    label: '拉曼光谱',
    description: 'Raman shift – 强度',
    template_id: 'raman_line',
    chart_type: 'line',
    chart_type_label: '折线图',
    axis_summary: 'Raman Shift – Intensity',
  },
  {
    data_type: 'uv_vis_spectrum',
    label: 'UV-Vis 吸收谱',
    description: '波长 – 吸光度',
    template_id: 'uv_vis_line',
    chart_type: 'line',
    chart_type_label: '折线图',
    axis_summary: 'Wavelength (nm) – Absorbance',
  },
  {
    data_type: 'ftir_spectrum',
    label: '红外 FTIR',
    description: '波数 – 透射率',
    template_id: 'ftir_line',
    chart_type: 'line',
    chart_type_label: '折线图',
    axis_summary: 'Wavenumber – Transmittance',
  },
  {
    data_type: 'mass_spectrum',
    label: '质谱',
    description: 'm/z – 相对强度',
    template_id: 'mass_spectrum_stem_like',
    chart_type: 'scatter',
    chart_type_label: '散点图',
    axis_summary: 'm/z – Relative Intensity',
  },
  {
    data_type: 'volcano_analysis',
    label: '差异表达火山图',
    description: 'log2FC – -log10(p)',
    template_id: 'volcano_default',
    chart_type: 'volcano',
    chart_type_label: '火山图',
    axis_summary: 'Log2 Fold Change – -log10(P-value)',
  },
  {
    data_type: 'generic_tabular',
    label: '通用表格',
    description: '两列数值',
    template_id: 'generic_scatter',
    chart_type: 'scatter',
    chart_type_label: '散点图',
    axis_summary: 'X – Y',
  },
]

export async function fetchPlotDataTemplates(): Promise<PlotDataTemplate[]> {
  const mode = getApiEntryMode()
  const path = mode === 'bff' ? '/plots/templates?contract=v2' : '/api/v1/data/plot/templates/v2'

  try {
    if (mode === 'bff') {
      const out = await researchJson<{ success: boolean; templates: PlotDataTemplate[] }>(path)
      if (out.templates?.length) return out.templates
    } else {
      const res = await researchFetch(path)
      const body = (await res.json()) as { templates?: PlotDataTemplate[] }
      if (body.templates?.length) return body.templates
    }
  } catch {
    /* use fallback */
  }
  return PLOT_DATA_TEMPLATES_FALLBACK
}
