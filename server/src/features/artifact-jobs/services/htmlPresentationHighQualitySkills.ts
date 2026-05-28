import fs from 'fs'
import path from 'path'

import {
  buildCandidateTemplatesSidecar,
  prepareSelectedBeautifulTemplateForJob,
  resolveBeautifulTemplateFile,
  type HtmlPresentationJobOptions,
  type TemplateSelectionResult,
} from './htmlPresentationTemplates'

export const AIOS_SKILLS_ROOT = '/data/darebug/aios-skills'

export const HIGH_QUALITY_ORIGINAL_SKILL_DIRS = [
  'beautiful-html-templates',
  'frontend-slides',
  'guizang-ppt-skil',
  'html-ppt-beautiful',
  'html-ppt-skill',
] as const

export const FAST_TEMPLATE_SKILL_DIRS = [
  'beautiful-html-templates',
  'html-ppt-skill',
] as const

export type HtmlPptSkillMode = 'fast-lite' | 'fast-template-driven' | 'high-original-five-skills'

export interface HtmlPptSkillStats {
  mode: HtmlPptSkillMode
  usesLiteSkill: boolean
  usesOriginalFiveSkills: boolean
  requiredSkills: string[]
  loadedSkills: string[]
  missingSkills: string[]
  skillPaths: Record<string, string>
  orchestrationPath?: string
  jobWorkspacePath?: string
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function copySkillMarkdownOnly(srcDir: string, destDir: string): boolean {
  const sourceSkillMd = path.join(srcDir, 'SKILL.md')
  if (!fs.existsSync(sourceSkillMd) || !fs.statSync(sourceSkillMd).isFile()) return false
  fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(sourceSkillMd, path.join(destDir, 'SKILL.md'))
  return true
}

export function resolveHtmlPptSkillMode(options: HtmlPresentationJobOptions): HtmlPptSkillMode {
  return options.qualityMode === 'high' ? 'high-original-five-skills' : 'fast-template-driven'
}

export function validateFastTemplateSkillPaths(): {
  loadedSkills: string[]
  missingSkills: string[]
  skillPaths: Record<string, string>
} {
  const loadedSkills: string[] = []
  const missingSkills: string[] = []
  const skillPaths: Record<string, string> = {}
  for (const skillName of FAST_TEMPLATE_SKILL_DIRS) {
    const candidate = path.join(AIOS_SKILLS_ROOT, skillName)
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) {
      missingSkills.push(skillName)
      continue
    }
    skillPaths[skillName] = fs.realpathSync(candidate)
    loadedSkills.push(skillName)
  }
  return { loadedSkills, missingSkills, skillPaths }
}

export function assertFastTemplateSkillsPreflight(): void {
  const result = validateFastTemplateSkillPaths()
  if (result.missingSkills.length > 0) {
    throw new Error(
      result.missingSkills.map((name) => `Missing required fast template skill: ${name}`).join('\n'),
    )
  }
}

export interface HtmlPptSkillPreflightResult {
  skillsRoot: string
  requiredSkills: string[]
  loadedSkills: string[]
  missingSkills: string[]
  skillPaths: Record<string, string>
  skillExists: Record<string, boolean>
}

export function runHtmlPptHighQualitySkillPreflight(): HtmlPptSkillPreflightResult {
  const validation = validateOriginalSkillPaths()
  const skillExists: Record<string, boolean> = {}
  for (const skillName of HIGH_QUALITY_ORIGINAL_SKILL_DIRS) {
    skillExists[skillName] = validation.loadedSkills.includes(skillName)
  }
  return {
    skillsRoot: AIOS_SKILLS_ROOT,
    requiredSkills: [...HIGH_QUALITY_ORIGINAL_SKILL_DIRS],
    loadedSkills: validation.loadedSkills,
    missingSkills: validation.missingSkills,
    skillPaths: validation.skillPaths,
    skillExists,
  }
}

export function logHtmlPptHighQualitySkillPreflight(): HtmlPptSkillPreflightResult {
  const result = runHtmlPptHighQualitySkillPreflight()
  console.info(`[html-ppt-preflight] skillsRoot=${result.skillsRoot}`)
  for (const skillName of HIGH_QUALITY_ORIGINAL_SKILL_DIRS) {
    console.info(
      `[html-ppt-preflight] skill=${skillName} exists=${String(result.skillExists[skillName])} path=${result.skillPaths[skillName] || '(missing)'}`,
    )
  }
  if (result.missingSkills.length > 0) {
    console.warn(
      `[html-ppt-preflight] missingSkills=${result.missingSkills.join(', ')} (high mode jobs will fail until fixed)`,
    )
  }
  return result
}

export function assertHtmlPptHighQualitySkillsPreflight(): HtmlPptSkillPreflightResult {
  const result = runHtmlPptHighQualitySkillPreflight()
  if (result.missingSkills.length > 0) {
    throw new Error(
      result.missingSkills.map((name) => `Missing required original skill: ${name}`).join('\n'),
    )
  }
  return result
}

export function validateOriginalSkillPaths(): {
  loadedSkills: string[]
  missingSkills: string[]
  skillPaths: Record<string, string>
} {
  const loadedSkills: string[] = []
  const missingSkills: string[] = []
  const skillPaths: Record<string, string> = {}

  for (const skillName of HIGH_QUALITY_ORIGINAL_SKILL_DIRS) {
    const candidate = path.join(AIOS_SKILLS_ROOT, skillName)
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) {
      missingSkills.push(skillName)
      continue
    }
    skillPaths[skillName] = fs.realpathSync(candidate)
    loadedSkills.push(skillName)
  }

  return { loadedSkills, missingSkills, skillPaths }
}

function buildTemplateLockSection(selection?: TemplateSelectionResult): string[] {
  if (!selection?.templateLocked) return []
  const templateName = selection.selectedTemplate.name
  const templateSlug = selection.selectedTemplateSlug
  return [
    '## User-selected template (hard lock)',
    '',
    `用户已选择 HTML Slides 模板：${templateName}`,
    `模板 slug：${templateSlug}`,
    '',
    '你必须基于 `selected-template/template.html` 的结构和 `selected-template/design.md` 的设计规则生成最终 HTML Slides。',
    '',
    '要求：',
    '1. 保留该模板的视觉语言、颜色、字体、背景、导航点、页码样式与 slide class。',
    '2. 不要只复用 cover 页；必须生成多页，每一页都有实际标题和正文内容。',
    '3. 不要留下模板 demo 文案（如 Slide 1、英文 placeholder、示例公司名）。',
    '4. 不要生成空白页或只有背景/页码的页面。',
    '5. 不要把内容塞进一个通用 aios-template 结构。',
    '6. 不要自行改用其他模板。',
    '7. 如果模板有多页示例，请学习不同页型并按内容选择合适页型。',
    '8. 图片区域使用可替换占位，并带 `data-block-type="image"` 与 `data-image-prompt`（后处理会生成图片，不要在页面上显示 prompt 文本）。',
    '',
    '必读文件：',
    '- selected-template/template.html',
    '- selected-template/design.md',
    '- selected-template/template.json',
    '- selected-template/AGENTS.md（若存在）',
    '',
  ]
}

function buildOrchestrationMarkdown(options: HtmlPresentationJobOptions, selection?: TemplateSelectionResult): string {
  const skillLines = HIGH_QUALITY_ORIGINAL_SKILL_DIRS.map((name) => `- skills/${name}/`).join('\n')
  return [
    '# High-Quality HTML Presentation Orchestration',
    '',
    'This job generates a **high-quality HTML presentation** using the **original five skills** copied into this workspace.',
    '',
    '## Skill bundle (required — do not substitute)',
    skillLines,
    '',
    '## Rules',
    '',
    '- Use the original five skills in this workspace.',
    '- **Do not** replace them with a lite `SKILL.md` under `skill/`.',
    '- **Do not** use external CDN resources.',
    '- **Do not** fetch remote images or access the public internet for assets.',
    '- **Do not** embed remote image URLs in HTML.',
    '- For visuals, create semantic **image prompts**, `data-block-type="image"` blocks, or visual slots only.',
    '- The backend post-process will fulfill image prompts through the configured **server-side image provider**.',
    '- Write intermediate plans and reports under `output/intermediate/`.',
    '- Write the final deck to **`output/index.html`** (single-file HTML, inline CSS).',
    '- Final HTML must preview offline in an iframe without external dependencies.',
    '',
    ...buildTemplateLockSection(selection),
    '## Suggested intermediate artifacts (write when possible)',
    '',
    '- `output/intermediate/skill-context.md`',
    '- `output/intermediate/slide-plan.json` or `slide-plan.md`',
    '- `output/intermediate/template-plan.json` or `template-plan.md`',
    '- `output/intermediate/visual-plan.json` or `visual-plan.md`',
    '- `output/intermediate/final-check.md`',
    '',
    '## Slide markup',
    '',
    '- Prefer the same slide root tag and classes as selected-template/template.html (often `<div class="slide ...">`).',
    '- Each slide must include `data-slide-id="slide-NNN"`.',
    '- Text blocks: `data-block-id`, `data-block-type="text"`, `data-block-role`',
    '- Image blocks: `data-block-type="image"`, `data-block-role="visual"`, `data-image-prompt="..."`',
    '',
    '## Image policy for this job',
    '',
    `- qualityMode: ${options.qualityMode}`,
    `- enableImages: ${String(options.enableImages)}`,
    `- maxImages: ${options.maxImages}`,
    `- templateSlug: ${options.templateSlug || '(auto)'}`,
    `- templateLocked: ${String(Boolean(selection?.templateLocked))}`,
    ...(selection?.templateLocked
      ? [`- requestedTemplateSlug: ${selection.requestedTemplateSlug || selection.selectedTemplateSlug}`]
      : []),
    '',
    '## Output paths',
    '',
    '- Final HTML: `output/index.html`',
    '- Assets (filled by backend): `output/assets/`',
    '- Sidecar models (may be refined by backend): `output/content-model.json`',
  ].join('\n')
}

export function prepareHighQualityOriginalSkillWorkspace(input: {
  jobDir: string
  options: HtmlPresentationJobOptions
  skillPrepareLogPath: string
  templateSelection?: TemplateSelectionResult
}): HtmlPptSkillStats {
  const validation = assertHtmlPptHighQualitySkillsPreflight()

  const skillsDir = path.join(input.jobDir, 'skills')
  const outputDir = path.join(input.jobDir, 'output')
  const intermediateDir = path.join(outputDir, 'intermediate')
  const assetsDir = path.join(outputDir, 'assets')
  fs.mkdirSync(skillsDir, { recursive: true })
  fs.mkdirSync(intermediateDir, { recursive: true })
  fs.mkdirSync(assetsDir, { recursive: true })

  for (const skillName of HIGH_QUALITY_ORIGINAL_SKILL_DIRS) {
    const sourcePath = validation.skillPaths[skillName]
    const targetPath = path.join(skillsDir, skillName)
    fs.rmSync(targetPath, { recursive: true, force: true })
    copyDirRecursive(sourcePath, targetPath)
  }

  const orchestrationPath = path.join(input.jobDir, 'ORCHESTRATION.md')
  fs.writeFileSync(orchestrationPath, buildOrchestrationMarkdown(input.options, input.templateSelection), 'utf-8')

  if (input.templateSelection) {
    const outputDir = path.join(input.jobDir, 'output')
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(
      path.join(outputDir, 'template-profile.json'),
      JSON.stringify(input.templateSelection.templateProfile, null, 2),
      'utf-8',
    )
    fs.writeFileSync(
      path.join(outputDir, 'candidate-templates.json'),
      JSON.stringify(buildCandidateTemplatesSidecar(input.templateSelection), null, 2),
      'utf-8',
    )
    prepareSelectedBeautifulTemplateForJob({
      jobDir: input.jobDir,
      templateSlug: input.templateSelection.selectedTemplateSlug,
      templateName: input.templateSelection.selectedTemplate.name,
    })
    const intermediateDir = path.join(outputDir, 'intermediate')
    fs.mkdirSync(intermediateDir, { recursive: true })
    const templateFile = resolveBeautifulTemplateFile(input.templateSelection.selectedTemplateSlug)
    if (templateFile) {
      fs.copyFileSync(templateFile, path.join(intermediateDir, 'selected-template.html'))
    }
  }

  const logLines = [
    'skillMode=high-original-five-skills',
    'usesLiteSkill=false',
    'usesOriginalFiveSkills=true',
    'lite skill disabled for high quality mode',
    'using original five skills',
    `jobWorkspacePath=${input.jobDir}`,
    `orchestrationPath=${orchestrationPath}`,
    ...HIGH_QUALITY_ORIGINAL_SKILL_DIRS.map((name) => `skillPath.${name}=${validation.skillPaths[name]}`),
    ...HIGH_QUALITY_ORIGINAL_SKILL_DIRS.map((name) => `skillExists.${name}=true`),
  ]
  fs.mkdirSync(path.dirname(input.skillPrepareLogPath), { recursive: true })
  fs.writeFileSync(input.skillPrepareLogPath, `${logLines.join('\n')}\n`, 'utf-8')

  return {
    mode: 'high-original-five-skills',
    usesLiteSkill: false,
    usesOriginalFiveSkills: true,
    requiredSkills: [...HIGH_QUALITY_ORIGINAL_SKILL_DIRS],
    loadedSkills: validation.loadedSkills,
    missingSkills: [],
    skillPaths: validation.skillPaths,
    orchestrationPath,
    jobWorkspacePath: input.jobDir,
  }
}

export function buildHighQualityOpenCodePrompt(
  userPrompt: string,
  options: HtmlPresentationJobOptions,
  repairOnly = false,
  templateSelection?: TemplateSelectionResult,
): string {
  const repairLines = repairOnly
    ? [
      'Repair pass: ensure output/index.html exists with the generated deck.',
      'Do not expand slide count dramatically.',
    ]
    : [
      'Generate a polished 7-12 slide HTML presentation suitable for formal reporting.',
      'Read ORCHESTRATION.md first, then consult the five skills under skills/.',
    ]

  const imageLines = !options.enableImages || options.maxImages <= 0
    ? ['Image mode: none — do not add img tags or visual slots.']
    : [
      `Image mode: planned — up to ${options.maxImages} visuals.`,
      'Add image blocks with data-image-prompt only; do not embed remote images.',
      'Backend will fulfill prompts via server-side image provider.',
    ]

  const templateLockLines = templateSelection?.templateLocked
    ? [
      '',
      `Template lock: use "${templateSelection.selectedTemplate.name}" (slug=${templateSelection.selectedTemplateSlug}) only.`,
      'Read selected-template/template.html and selected-template/design.md before writing output/index.html.',
      'Generate a complete multi-slide deck in the same visual system as the template (all pages must have real content).',
      'Do not auto-pick a different template from skills/beautiful-html-templates/.',
      'Do not leave template demo text in the final deck.',
    ]
    : []

  return [
    'High-quality HTML PPT task — original five-skill bundle.',
    '',
    '1. Read ORCHESTRATION.md.',
    '2. Read input/source.md.',
    '3. If template is locked, read selected-template/template.html, selected-template/design.md, selected-template/template.json.',
    '4. Use skills/beautiful-html-templates/, skills/frontend-slides/, skills/guizang-ppt-skil/, skills/html-ppt-beautiful/, skills/html-ppt-skill/ for guidance only.',
    '5. Do NOT use skill/SKILL.md lite workspace.',
    '6. Write intermediate artifacts to output/intermediate/ when possible.',
    '7. Write final HTML to output/index.html only.',
    '8. No remote images in HTML; image prompts only.',
    ...imageLines,
    ...repairLines,
    ...templateLockLines,
    '',
    'User prompt:',
    userPrompt,
  ].join('\n')
}

function buildTemplateDrivenOpenCodeAttachments(
  jobDir: string,
  inputPath: string,
  skillNames: readonly string[],
  orchestrationFileName = 'ORCHESTRATION.md',
): string[] {
  const attachments = [
    path.join(jobDir, orchestrationFileName),
    path.join(jobDir, 'SELECTED_TEMPLATE.md'),
    inputPath,
  ]
  const selectedTemplateDir = path.join(jobDir, 'selected-template')
  if (fs.existsSync(selectedTemplateDir)) {
    for (const name of ['template.html', 'design.md', 'template.json', 'AGENTS.md', 'templates-index.json']) {
      const filePath = path.join(selectedTemplateDir, name)
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) attachments.push(filePath)
    }
  }
  for (const skillName of skillNames) {
    const skillMd = path.join(jobDir, 'skills', skillName, 'SKILL.md')
    if (fs.existsSync(skillMd) && fs.statSync(skillMd).isFile()) {
      attachments.push(skillMd)
    }
  }
  return attachments
}

export function buildHighQualityOpenCodeAttachments(jobDir: string, inputPath: string): string[] {
  return buildTemplateDrivenOpenCodeAttachments(jobDir, inputPath, HIGH_QUALITY_ORIGINAL_SKILL_DIRS)
}

function buildFastOrchestrationMarkdown(
  options: HtmlPresentationJobOptions,
  selection?: TemplateSelectionResult,
): string {
  const templateName = selection?.selectedTemplate.name ?? selection?.selectedTemplateSlug ?? options.templateSlug ?? ''
  const templateSlug = selection?.selectedTemplateSlug ?? options.templateSlug ?? ''
  return [
    '# Fast HTML Slides Orchestration',
    '',
    '你正在快速生成 HTML Slides。',
    '',
    `用户已选择模板：${templateName}`,
    `模板 slug：${templateSlug}`,
    '',
    '你只能使用 selected-template/template.html 的视觉系统。',
    '不要搜索其他模板。',
    '不要读取全量模板库。',
    '不要进行长时间分析。',
    '不要生成图片。',
    '不要写解释说明。',
    '',
    '第一步必须创建并写入：output/index.html',
    '',
    '任务：',
    '基于用户输入，直接改写 selected-template/template.html，生成 6-8 页 HTML Slides。',
    '',
    '必须保留：',
    '- 模板 CSS',
    '- 字体',
    '- 颜色',
    '- 布局',
    '- slide class',
    '- 装饰元素',
    '- 导航和页码系统',
    '',
    '必须替换：',
    '- demo 标题',
    '- demo 正文',
    '- demo 数字',
    '- demo 日期',
    '- demo 图片占位',
    '',
    '要求：',
    '1. 每页必须有标题和正文。',
    '2. 不允许空白页。',
    '3. 不允许黑屏页。',
    '4. 不允许 imagePrompt 可见。',
    '5. 不允许出现“下一步建议”。',
    '6. 不允许出现 safe renderer 文案。',
    '7. 不允许保留 demo text。',
    '8. 不允许切换模板。',
    '9. 没有图片时隐藏图片区域或保留无文字装饰。',
    '10. 只输出最终 HTML 文件，不输出分析过程。',
    '',
    `qualityMode: ${options.qualityMode}`,
    'enableImages: false',
    'maxImages: 0',
    `templateLocked: ${String(Boolean(selection?.templateLocked))}`,
  ].join('\n')
}

export function prepareFastTemplateDrivenSkillWorkspace(input: {
  jobDir: string
  options: HtmlPresentationJobOptions
  skillPrepareLogPath: string
  templateSelection: TemplateSelectionResult
}): HtmlPptSkillStats {
  const validation = validateFastTemplateSkillPaths()
  const skillsDir = path.join(input.jobDir, 'skills')
  const outputDir = path.join(input.jobDir, 'output')
  fs.mkdirSync(skillsDir, { recursive: true })
  fs.mkdirSync(path.join(outputDir, 'assets'), { recursive: true })
  fs.mkdirSync(path.join(outputDir, 'intermediate'), { recursive: true })

  // Fast mode keeps a minimal workspace: selected-template + source + orchestration + optional SKILL.md files only.
  for (const skillName of FAST_TEMPLATE_SKILL_DIRS) {
    const sourcePath = validation.skillPaths[skillName]
    if (!sourcePath) continue
    const targetPath = path.join(skillsDir, skillName)
    fs.rmSync(targetPath, { recursive: true, force: true })
    copySkillMarkdownOnly(sourcePath, targetPath)
  }

  const orchestrationPath = path.join(input.jobDir, 'ORCHESTRATION.md')
  fs.writeFileSync(orchestrationPath, buildFastOrchestrationMarkdown(input.options, input.templateSelection), 'utf-8')

  fs.writeFileSync(
    path.join(outputDir, 'template-profile.json'),
    JSON.stringify(input.templateSelection.templateProfile, null, 2),
    'utf-8',
  )
  fs.writeFileSync(
    path.join(outputDir, 'candidate-templates.json'),
    JSON.stringify(buildCandidateTemplatesSidecar(input.templateSelection), null, 2),
    'utf-8',
  )

  prepareSelectedBeautifulTemplateForJob({
    jobDir: input.jobDir,
    templateSlug: input.templateSelection.selectedTemplateSlug,
    templateName: input.templateSelection.selectedTemplate.name,
  })

  const templateFile = resolveBeautifulTemplateFile(input.templateSelection.selectedTemplateSlug)
  if (templateFile) {
    fs.copyFileSync(templateFile, path.join(outputDir, 'intermediate', 'selected-template.html'))
  }

  const logLines = [
    'skillMode=fast-template-driven',
    'usesLiteSkill=false',
    'usesOriginalFiveSkills=false',
    'fast-lite disabled; using template-driven OpenCode',
    'fastWorkspace=minimal-selected-template-only',
    `jobWorkspacePath=${input.jobDir}`,
    `orchestrationPath=${orchestrationPath}`,
    `selectedTemplateSlug=${input.templateSelection.selectedTemplateSlug}`,
    ...FAST_TEMPLATE_SKILL_DIRS.map((name) => `skillPath.${name}=${validation.skillPaths[name]}`),
  ]
  fs.mkdirSync(path.dirname(input.skillPrepareLogPath), { recursive: true })
  fs.writeFileSync(input.skillPrepareLogPath, `${logLines.join('\n')}\n`, 'utf-8')

  return {
    mode: 'fast-template-driven',
    usesLiteSkill: false,
    usesOriginalFiveSkills: false,
    requiredSkills: [...FAST_TEMPLATE_SKILL_DIRS],
    loadedSkills: validation.loadedSkills,
    missingSkills: [],
    skillPaths: validation.skillPaths,
    orchestrationPath,
    jobWorkspacePath: input.jobDir,
  }
}

export function buildFastTemplateDrivenOpenCodePrompt(
  userPrompt: string,
  options: HtmlPresentationJobOptions,
  templateSelection: TemplateSelectionResult,
  repairOnly = false,
): string {
  const repairLines = repairOnly
    ? ['Repair pass: ensure output/index.html exists.', 'Do not add many new slides.']
    : [
      '立即生成 output/index.html，不要只创建目录，不要等待进一步指令。',
      '快速生成 6-8 页 HTML Slides，并直接完成。',
    ]

  return [
    '立即生成 output/index.html，不要只创建目录，不要等待进一步指令。',
    '',
    `用户已选择模板：${templateSelection.selectedTemplate.name}`,
    `模板 slug：${templateSelection.selectedTemplateSlug}`,
    '',
    '请基于 selected-template/template.html、template.json、design.md 快速生成 HTML Slides。',
    '',
    '要求：',
    '1. 保留模板字体、颜色、布局、slide class、装饰元素和导航 runtime。',
    '2. 替换 demo 标题、demo 正文、demo 数字、demo 日期。',
    '3. 根据用户 prompt 生成多页内容。',
    '4. 每页必须有可见标题和正文。',
    '5. 需要更多页时复制最合适的已有 layout。',
    '6. 不要输出空白页。',
    '7. 不要显示 imagePrompt。',
    '8. 不要生成真实图片；图片区域隐藏或使用无文字 soft placeholder。',
    '9. 不要改用其他模板。',
    '10. 不要使用 generic renderer。',
    '',
    '1. Read ORCHESTRATION.md.',
    '2. Read SELECTED_TEMPLATE.md.',
    '3. Read input/source.md.',
    '4. Write output/index.html only.',
    '5. Do not scan any full template library.',
    '6. Do not switch template.',
    ...repairLines,
    '',
    'User prompt:',
    userPrompt,
  ].join('\n')
}

export function buildFastTemplateDrivenOpenCodeAttachments(jobDir: string, inputPath: string): string[] {
  return buildTemplateDrivenOpenCodeAttachments(jobDir, inputPath, FAST_TEMPLATE_SKILL_DIRS)
}

export function buildFastTemplateValidationRepairOpenCodeAttachments(
  jobDir: string,
  inputPath: string,
  htmlPath: string,
): string[] {
  const attachments = buildTemplateDrivenOpenCodeAttachments(jobDir, inputPath, FAST_TEMPLATE_SKILL_DIRS)
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    attachments.unshift(htmlPath)
  }
  return attachments
}

export function buildFastTemplateValidationRepairOpenCodePrompt(
  userPrompt: string,
  templateSelection: TemplateSelectionResult,
  validationSummary?: string,
): string {
  const templateName = templateSelection.selectedTemplate.name
  const templateSlug = templateSelection.selectedTemplateSlug
  return [
    'Fast template-driven HTML PPT — validation repair pass.',
    '',
    '当前 output/index.html 未通过页面校验。请在保留 selected-template 视觉系统的前提下修复该文件，不要重新设计整套 deck。',
    '',
    validationSummary ? `校验摘要：${validationSummary}` : '',
    '',
    `用户已选择模板：${templateName}`,
    `模板 slug：${templateSlug}`,
    '',
    '修复要求：',
    '1. 每页必须有可见标题和正文，不允许空白页或只有背景/页码的页面。',
    '2. 不允许残留模板 demo 文案（如 Slide 1、示例公司名、英文 placeholder）。',
    '3. 不允许 imagePrompt 或配图说明文字出现在页面上。',
    '4. 不允许出现 generic safe renderer 文案（如「下一步建议」「快速备用渲染」）。',
    '5. 保留 selected-template 的字体、颜色、slide class、装饰元素与导航 runtime。',
    '6. 不要更换模板，不要使用 generic renderer 或 beautifulHtmlTemplateAdapter。',
    '7. 不要生成真实图片；图片区域隐藏或使用无文字 soft placeholder。',
    '8. 只修改并覆盖 output/index.html（单文件、内联 CSS）。',
    '',
    '必读：ORCHESTRATION.md、SELECTED_TEMPLATE.md、selected-template/template.html、selected-template/design.md、当前 output/index.html。',
    '',
    'User prompt（内容方向参考，不要删减已生成页数太多）：',
    userPrompt,
  ].filter(Boolean).join('\n')
}
