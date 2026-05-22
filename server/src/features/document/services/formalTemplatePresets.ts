/**
 * formalTemplatePresets.ts — preset formal document template registry
 *
 * Each template has:
 *   - id, label, description, category
 *   - templateText: the template body with {{field}} placeholders and section markers
 *   - defaultSections: ordered list of section headings for LLM generation
 */

export interface FormalTemplatePreset {
  id: string
  label: string
  description: string
  category: 'letter' | 'notice' | 'report' | 'contract' | 'general'
  templateText: string
  defaultSections: string[]
}

export const FORMAL_TEMPLATE_PRESETS: FormalTemplatePreset[] = [
  {
    id: 'visit_letter',
    label: '访问函',
    description: '向外单位发送正式访问/考察请求',
    category: 'letter',
    templateText: `{{收件单位}}

尊敬的{{收件人}}：

您好！

{{发件单位}}拟于{{访问日期}}前往贵单位进行{{访问目的}}，特函联系。

{{访问背景}}

为此，我方申请如下：

{{具体请求}}

望贵单位给予大力支持与协助。敬请回复。

此致
敬礼

{{发件单位}}
{{签发人}}
{{日期}}`,
    defaultSections: ['访问背景', '具体请求'],
  },
  {
    id: 'official_notice',
    label: '正式通知',
    description: '向各部门/单位发出的正式行政通知',
    category: 'notice',
    templateText: `{{发文单位}}

{{标题}}

各{{受文对象}}：

{{背景说明}}

现就有关事项通知如下：

{{工作要求}}

{{时间安排}}

请各单位高度重视，认真贯彻落实。如有疑问，请联系{{联系部门}}（联系人：{{联系人}}）。

{{发文单位}}
{{日期}}`,
    defaultSections: ['背景说明', '工作要求', '时间安排'],
  },
  {
    id: 'work_report',
    label: '工作报告',
    description: '向上级汇报工作进展与成果的正式报告',
    category: 'report',
    templateText: `{{报告标题}}

{{报告对象}}：

{{汇报部门}}{{时间段}}工作情况汇报如下：

一、主要工作完成情况

{{主要工作}}

二、存在的问题与不足

{{存在问题}}

三、下阶段工作计划

{{工作计划}}

四、请示事项（如有）

{{请示事项（可选）}}

特此汇报。

{{汇报部门}}
{{汇报人}}
{{日期}}`,
    defaultSections: ['主要工作', '存在问题', '工作计划'],
  },
  {
    id: 'investigation_report',
    label: '调查报告',
    description: '针对特定问题或事件的调查情况报告',
    category: 'report',
    templateText: `{{报告标题}}

{{报告对象}}：

根据{{调查来源}}，{{调查单位}}于{{调查时间}}对{{调查对象}}开展了专项调查。现将调查情况报告如下：

一、基本情况

{{基本情况}}

二、调查发现

{{调查发现}}

三、问题分析

{{问题分析}}

四、处理建议

{{处理建议}}

以上为调查情况，请审阅。

{{调查单位}}
{{调查人}}
{{日期}}`,
    defaultSections: ['基本情况', '调查发现', '问题分析', '处理建议'],
  },
  {
    id: 'meeting_minutes',
    label: '会议纪要',
    description: '记录会议内容与决议事项',
    category: 'general',
    templateText: `{{会议名称}}纪要

会议时间：{{会议时间}}
会议地点：{{会议地点}}
主持人：{{主持人}}
参会人员：{{参会人员}}
记录人：{{记录人}}

一、会议议题

{{会议议题}}

二、会议讨论情况

{{讨论情况}}

三、会议决议

{{会议决议}}

四、后续行动

{{后续行动}}

本纪要经与会人员确认后生效。

{{发文单位}}
{{日期}}`,
    defaultSections: ['会议议题', '讨论情况', '会议决议', '后续行动'],
  },
  {
    id: 'custom',
    label: '自定义模板',
    description: '粘贴您自己的模板文本（支持 {{字段名}} 占位符）',
    category: 'general',
    templateText: '',
    defaultSections: [],
  },
]

export function getPreset(id: string): FormalTemplatePreset | undefined {
  return FORMAL_TEMPLATE_PRESETS.find((p) => p.id === id)
}
