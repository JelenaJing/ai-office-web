# HTML / PPT Skill 审计报告

本报告只基于实际文件审计，不做业务接入、不改生成链路、不改页面代码。

审计对象：

- `/data/darebug/aios-skills/beautiful-html-templates`
- `/data/darebug/aios-skills/frontend-slides`
- `/data/darebug/aios-skills/guizang-ppt-skill`
- `/data/darebug/aios-skills/html-ppt-skill`
- `/data/darebug/aios-skills/html-ppt-beautiful`
- `/data/darebug/aios-skills/marp-slides`

补充核对：

- `ai-office-web/server/src/features/skills/skillRegistry.ts`
- `ai-office-web/server/src/features/artifact-jobs/services/opencodeHtmlArtifactRunner.ts`
- `ai-office-web/src/web/pages/HtmlPptPage.tsx`

关键事实先写在前面：

1. `html-ppt-beautiful` 已经是 **ai-office-web 当前实际接入** 的 HTML PPT skill 入口。
2. `html-ppt-skill` 是 **能力最完整** 的独立 HTML PPT studio，但当前并 **未直接接入** `ai-office-web`。
3. `frontend-slides` 是 **生成器 + 生成规范**，不是现成 runtime 包；但它确实提供了 **可选的文本内联编辑方案**。
4. `beautiful-html-templates` 是 **模板库**，不是主生成器。
5. `marp-slides` 适合 **Markdown/Marp 导出**，不适合做 HTML PPT 主生成器。
6. 本次审计范围内 **没有任何一个资源原生提供 `data-slide-id` / `data-block-id`**。

---

## 一、资源总览

> 注：这里的“可执行入口”按实际文件判断，包含 `SKILL.md`、模板 HTML、脚本入口或已被 AIOS 元数据声明的入口。

| 资源 | 实际路径 | README.md | SKILL.md | package.json | templates | assets | examples | runtime | 可执行入口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| beautiful-html-templates | `/data/darebug/aios-skills/beautiful-html-templates` | 是 | 否 | 否 | 是 | 否 | 否 | 是 | 是（`AGENTS.md`、模板目录、`runtime/`） |
| frontend-slides | `/data/darebug/aios-skills/frontend-slides` | 是 | 是 | 否 | 否 | 否 | 否 | 否 | 是（`SKILL.md`、`scripts/extract-pptx.py`） |
| guizang-ppt-skill | `/data/darebug/aios-skills/guizang-ppt-skill` | 是 | 是 | 否 | 否 | 是 | 否 | 否 | 是（`SKILL.md`、`assets/template.html`、`assets/template-swiss.html`） |
| html-ppt-skill | `/data/darebug/aios-skills/html-ppt-skill` | 是 | 是 | 否 | 是 | 是 | 是 | 否 | 是（`SKILL.md`、`templates/deck.html`、`templates/full-decks-index.html`、`scripts/new-deck.sh`、`scripts/render.sh`） |
| html-ppt-beautiful | `/data/darebug/aios-skills/html-ppt-beautiful` | 否 | 是 | 否 | 否 | 否 | 否 | 否 | 是（`SKILL.md`；`metadata.json` 声明 `entryFile=SKILL.md`） |
| marp-slides | `/data/darebug/aios-skills/marp-slides` | 是 | 是 | 否 | 否 | 否 | 是 | 否 | 是（`SKILL.md`；导出依赖外部 `marp-cli`） |

补充说明：

- `beautiful-html-templates/index.json` 实际 `template_count` 为 **34**；`AGENTS.md` 中示例里的 28 是旧示例，不应再当真值。
- `skillRegistry.ts` 只会加载带 `metadata.json` 的 skill。按当前文件状态，6 个资源里真正能被 `ai-office-web` 直接识别成 skill 的，只有 `html-ppt-beautiful`。

---

## 二、逐个审计

### 1. beautiful-html-templates

1. **定位是什么？**  
   一个给 agent 选型和改写用的 **HTML deck 模板库**。
2. **输入是什么？**  
   用户 brief、场景/情绪、选中的模板、待替换文案与图片。
3. **输出是什么？**  
   选中的模板目录、预览 HTML、以及被改写后的 deck。
4. **它是生成器、模板库、runtime、导出工具，还是设计规范？**  
   **模板库**，附带 agent 操作规范；不是独立主生成器。
5. **是否可以生成 HTML PPT？**  
   **可以，但要靠外部 agent 驱动。**
6. **是否可以生成单文件 HTML？**  
   **不原生保证。** `AGENTS.md` 明确提到模板可能依赖 `styles.css`、`deck-stage.js` 等 sibling assets。
7. **是否支持多模板？**  
   **支持。** `index.json` 里实际有 34 个模板。
8. **是否支持图片？**  
   **支持。** `AGENTS.md` 明确要求替换图片占位。
9. **是否支持动画？**  
   **没有统一动画能力声明。** 有 `runtime/`，部分模板可能带运行时，但不能把它当统一动画引擎。
10. **是否支持 presenter mode？**  
    **没有证据。**
11. **是否支持局部编辑？**  
    **没有证据。**
12. **是否支持用户点击某个区域后编辑？**  
    **不支持。**
13. **是否支持更换模板？**  
    **支持。** 它的核心就是重新选模板再套内容。
14. **是否支持导出 PPTX？**  
    **没有证据。**
15. **是否适合作为主生成器？**  
    **不适合。** 它缺少统一生成协议、内容模型和单文件输出约束。
16. **是否只适合作为辅助模块？**  
    **是。** 很适合做模板库。
17. **是否可以直接接入 ai-office-web？**  
    **不能直接接。** 它没有 `metadata.json`，也不是单一 skill 入口。
18. **如果要接入，需要什么适配层？**  
    需要：模板选择器、内容映射器、资源打包/内联器、统一输出 `output/index.html` 的生成器、后续可选的 `data-slide-id` / `data-block-id` 注入层。

### 2. frontend-slides

1. **定位是什么？**  
   一个面向 agent 的 **零依赖单文件 HTML 演示文稿生成器/生成规范**。
2. **输入是什么？**  
   用户主题、文本内容、可选图片、可选 PPTX、风格偏好、是否需要浏览器内编辑。
3. **输出是什么？**  
   单文件 HTML deck；可附带风格预览；可选 PDF/URL 分享。
4. **它是生成器、模板库、runtime、导出工具，还是设计规范？**  
   **生成器 + 生成规范**；不是独立 runtime 包。
5. **是否可以生成 HTML PPT？**  
   **可以。**
6. **是否可以生成单文件 HTML？**  
   **可以。** README 明确写了 single HTML with inline CSS/JS。
7. **是否支持多模板？**  
   **支持多风格 preset，但不是模板库式多模板。** 更像多视觉 preset。
8. **是否支持图片？**  
   **支持。** 有图片评估、处理、落位规则。
9. **是否支持动画？**  
   **支持。** `animation-patterns.md`、`html-template.md`、`SKILL.md` 都有明确约束。
10. **是否支持 presenter mode？**  
    **没有证据。**
11. **是否支持局部编辑？**  
    **支持文本级局部编辑。** `html-template.md` 明确写了 opt-in inline editing。
12. **是否支持用户点击某个区域后编辑？**  
    **支持文本块点击编辑，但前提是生成时启用 edit mode。** 这不是 AnyGen 式选区系统。
13. **是否支持更换模板？**  
    **可以换 style preset 重新生成，但没有稳定的模板切换协议或 content-model。**
14. **是否支持导出 PPTX？**  
    **不支持。** 它支持把 PPTX 转成 HTML，不支持反向导出 PPTX。
15. **是否适合作为主生成器？**  
    **适合作为轻量单文件生成器。** 但如果目标是“多模板 + 可换模版 + 内容模型复用”，它还不够。
16. **是否只适合作为辅助模块？**  
    **不是。** 它本身就能生成最终 HTML。
17. **是否可以直接接入 ai-office-web？**  
    **不能直接接。** 当前没有 `metadata.json`，也没有现成 AIOS 产物约定。
18. **如果要接入，需要什么适配层？**  
    需要：AIOS skill 元数据、输出路径约束、网络/依赖限制裁剪、风格选择桥接、`data-slide-id` / `data-block-id` 注入、后续 content-model 映射。

### 3. guizang-ppt-skill

1. **定位是什么？**  
   一个偏强风格的 **HTML 横向翻页 PPT 生成 skill**，同时覆盖配图和封面。
2. **输入是什么？**  
   文章、Markdown、PPT 核心观点、截图、图片需求、风格 A/B 选择。
3. **输出是什么？**  
   单文件 HTML 横向 deck，及可选配图/封面。
4. **它是生成器、模板库、runtime、导出工具，还是设计规范？**  
   **生成器 + 设计系统 + 图片/封面辅助工作流**。
5. **是否可以生成 HTML PPT？**  
   **可以。**
6. **是否可以生成单文件 HTML？**  
   **可以。** README 明确写了单文件 HTML。
7. **是否支持多模板？**  
   **部分支持。** 实际是两套视觉系统（Style A / Style B）+ 多布局，不是开放式模板库。
8. **是否支持图片？**  
   **强支持。** 这是它的长项之一。
9. **是否支持动画？**  
   **支持一定动态效果。** README 与模板里都提到 WebGL/canvas、低功耗静态模式。
10. **是否支持 presenter mode？**  
    **没有证据。**
11. **是否支持局部编辑？**  
    **没有给终端用户的局部编辑能力。**
12. **是否支持用户点击某个区域后编辑？**  
    **不支持。**
13. **是否支持更换模板？**  
    **支持在 Style A / B 与主题色之间切换，但不具备 content-model 驱动的模板切换层。**
14. **是否支持导出 PPTX？**  
    **不支持。** README FAQ 明确说当前核心交付是 HTML。
15. **是否适合作为主生成器？**  
    **不建议。** 风格过强、适用面偏窄、对 AI Office 的通用办公场景不够中性。
16. **是否只适合作为辅助模块？**  
    **更适合作为辅助模块。**
17. **是否可以直接接入 ai-office-web？**  
    **不能直接接。** 无 `metadata.json`，也没有当前 artifact-jobs 需要的轻量适配。
18. **如果要接入，需要什么适配层？**  
    需要：AIOS skill 元数据、输出约束、风格收敛、模板与图片槽位映射、编辑 ID 注入；更合理的是只复用它的图片规划与版式约束经验。

### 4. html-ppt-skill

1. **定位是什么？**  
   一个功能完整的 **HTML PPT Studio**。
2. **输入是什么？**  
   主题、观众、主题风格、起始模板、speaker notes 等。
3. **输出是什么？**  
   静态 HTML deck、themes/assets/runtime、示例 deck，以及 PNG render。
4. **它是生成器、模板库、runtime、导出工具，还是设计规范？**  
   **生成器 + runtime + 模板系统 + 渲染工具**。
5. **是否可以生成 HTML PPT？**  
   **可以。**
6. **是否可以生成单文件 HTML？**  
   **不原生主打。** 它的默认组织方式是多文件静态 deck（`assets/`、`templates/`、`examples/`）。
7. **是否支持多模板？**  
   **强支持。** 36 themes、15 full-deck templates、31 layouts。
8. **是否支持图片？**  
   **支持。** 有 image hero、image grid 等布局。
9. **是否支持动画？**  
   **强支持。** 27 CSS 动画 + 20 canvas FX。
10. **是否支持 presenter mode？**  
    **支持。** `README.md`、`SKILL.md` 与 `assets/runtime.js` 都是实锤。
11. **是否支持局部编辑？**  
    **不支持内建局部编辑。**
12. **是否支持用户点击某个区域后编辑？**  
    **不支持。**
13. **是否支持更换模板？**  
    **支持主题/模板/布局切换。** 但没有独立 content-model 复用协议。
14. **是否支持导出 PPTX？**  
    **没有证据。** 当前明确看到的是 PNG render，不是 PPTX export。
15. **是否适合作为主生成器？**  
    **从能力上适合。** 但对 `ai-office-web` 当前单文件 artifact 体系来说偏重。
16. **是否只适合作为辅助模块？**  
    **不是。**
17. **是否可以直接接入 ai-office-web？**  
    **不能直接接。** 当前没有 `metadata.json`，而且输出形态与 `output/index.html` 单文件约束不一致。
18. **如果要接入，需要什么适配层？**  
    需要：skill 元数据、单文件打包/内联器、输出路径统一、内容模型层、编辑 ID 注入、可能的 runtime 裁剪。

### 5. html-ppt-beautiful

1. **定位是什么？**  
   一个 AIOS 定制的 **HTML PPT 编排 skill**，负责把 `beautiful-html-templates` 和 `frontend-slides` 的能力拼成 `output/index.html`。
2. **输入是什么？**  
   `input/source.md` 和用户 prompt；`metadata.json` 也声明了 `markdown / outline / text` 输入。
3. **输出是什么？**  
   `output/index.html` 单文件 HTML 演示文稿。
4. **它是生成器、模板库、runtime、导出工具，还是设计规范？**  
   **编排型生成器 / 适配层**；不是完整模板库，也不是独立 runtime。
5. **是否可以生成 HTML PPT？**  
   **可以。**
6. **是否可以生成单文件 HTML？**  
   **可以。** `SKILL.md` 和 `metadata.json` 都明确要求 `output/index.html`。
7. **是否支持多模板？**  
   **概念上支持。** 它引用 `beautiful-html-templates` 做模板选择；但它自身目录里没有模板资产。
8. **是否支持图片？**  
   **可间接支持。** 它借 `frontend-slides` 的图片与布局规则，但自身没有独立图片模块。
9. **是否支持动画？**  
   **可间接支持。** 它借 `frontend-slides` 的动效规范。
10. **是否支持 presenter mode？**  
    **没有证据。**
11. **是否支持局部编辑？**  
    **没有原生内建。** 只能说它可借 `frontend-slides` 的文本编辑思路。
12. **是否支持用户点击某个区域后编辑？**  
    **当前不能视为已支持。**
13. **是否支持更换模板？**  
    **适合做模板切换入口。** 这是它比 `html-ppt-skill` 更贴合当前 AIOS 目标的地方。
14. **是否支持导出 PPTX？**  
    **不支持。**
15. **是否适合作为主生成器？**  
    **在 AIOS 当前上下文里适合做主入口。** 但它更像 orchestrator，不是最强独立内核。
16. **是否只适合作为辅助模块？**  
    **不是。** 它已经是当前系统的实际 skill 入口。
17. **是否可以直接接入 ai-office-web？**  
    **可以，而且已经在接。** `HtmlPptPage.tsx` 直接写了 `skillId: 'html-ppt-beautiful'`。
18. **如果要接入，需要什么适配层？**  
    严格说它已经有基础适配；若要正式升级，需要补：content-model、模板切换层、图片规划层、`data-slide-id` / `data-block-id`、轻编辑 runtime，而不是再接一堆新 skill。

### 6. marp-slides

1. **定位是什么？**  
   一个面向 Marp 的 **Markdown slides skill**。
2. **输入是什么？**  
   主题、Markdown、数据、CSV、示例风格。
3. **输出是什么？**  
   Marp Markdown deck，并可经 `marp-cli` 导出 HTML / PDF / PPTX。
4. **它是生成器、模板库、runtime、导出工具，还是设计规范？**  
   **Markdown 生成器 + 导出工具 + 示例库**。
5. **是否可以生成 HTML PPT？**  
   **可以，但走的是 Marp 路线。**
6. **是否可以生成单文件 HTML？**  
   **可导出 HTML，但它不是面向“单文件 HTML PPT 主链路”设计的。**
7. **是否支持多模板？**  
   **有限支持。** 有 dark/light themes 和 22 个示例 deck，更像示例参考，不是模板库。
8. **是否支持图片？**  
   **支持。**
9. **是否支持动画？**  
   **有限支持。** README/SKILL 提到 HTML export 保留 animations / interactive elements。
10. **是否支持 presenter mode？**  
    **没有证据。**
11. **是否支持局部编辑？**  
    **不支持。**
12. **是否支持用户点击某个区域后编辑？**  
    **不支持。**
13. **是否支持更换模板？**  
    **可以换主题和参考风格，但不是 HTML 模板切换体系。**
14. **是否支持导出 PPTX？**  
    **支持。** README 与 SKILL 都明确有 `--pptx`。
15. **是否适合作为主生成器？**  
    **不适合。** 它更适合 Markdown/Marp 导出链路。
16. **是否只适合作为辅助模块？**  
    **是。**
17. **是否可以直接接入 ai-office-web？**  
    **不能直接接。** 需要 Marp CLI 和 Markdown 编译链。
18. **如果要接入，需要什么适配层？**  
    需要：Markdown 中间层、Marp CLI worker、样式映射器、导出工作流；更适合作为可选导出链，而不是主链。

---

## 三、重点比较 html-ppt-skill 和 html-ppt-beautiful

| 比较项 | 结论 | 原因 |
| --- | --- | --- |
| 1. 哪个更适合作为主 HTML PPT 生成器？ | **html-ppt-beautiful（面向 ai-office-web 当前形态）** | 它已经以 `output/index.html` 为目标、已经有 `metadata.json`、已经被 `HtmlPptPage.tsx` 和 `opencodeHtmlArtifactRunner.ts` 实际接入。`html-ppt-skill` 更强，但更像独立 studio。 |
| 2. 哪个更容易和 beautiful-html-templates 结合？ | **html-ppt-beautiful** | 它的 `SKILL.md` 就是按“读 `beautiful-html-templates` + 参考 `frontend-slides` + 输出单文件 HTML”设计的。 |
| 3. 哪个更容易支持图片生成？ | **html-ppt-beautiful** | 它天然更适合做“模板槽位 + frontend-slides 图片规划 + 后续外部图片生成”的组合；`html-ppt-skill` 有图片布局，但和 `beautiful-html-templates` 的结合关系不如前者直接。 |
| 4. 哪个更容易支持选区编辑？ | **html-ppt-beautiful** | 它借的是 `frontend-slides`，而 `frontend-slides/html-template.md` 明确已有 opt-in 文本编辑设计；`html-ppt-skill` 当前没有内建编辑模型。 |
| 5. 哪个更容易和 ai-office-web 现有 artifact-jobs 兼容？ | **html-ppt-beautiful** | 当前后端对它有专门常量 `HTML_PPT_BEAUTIFUL_SKILL_ID`、专门 prompt、专门 lite workspace 准备逻辑。 |
| 6. 哪个更适合作为第一阶段 MVP？ | **html-ppt-beautiful** | 第一阶段更看重“单文件输出、已有接入、可挂模板库、可补局部编辑层”，不是 presenter mode 或超大模板工作室能力。 |

结论补一句：

- **`html-ppt-skill` 是更强的独立 HTML PPT studio。**
- **`html-ppt-beautiful` 是更适合当前 AIOS Web 第一阶段落地的主入口。**

---

## 四、重点判断 frontend-slides

1. **frontend-slides 是生成器还是 runtime？**  
   **本质上是生成器/生成规范，不是现成 runtime 包。**

2. **frontend-slides 是否天然支持编辑？**  
   **支持可选文本编辑，但不是天然的结构化编辑器。**  
   实锤来自 `html-template.md`：有 `editToggle`、`contenteditable`、`localStorage`、`Ctrl+S` 导出逻辑。

3. **如果不支持编辑，它能否作为播放/动画/键盘切换 runtime？**  
   **能。**  
   `html-template.md` 明确给了 slide controller：键盘导航、触摸、滚轮、progress bar、nav dots、动画 reveal。

4. **是否可以在它基础上注入 `data-slide-id` / `data-block-id` 选区编辑能力？**  
   **可以，但需要新增一层 schema 注入。**  
   当前文件里没有任何 `data-slide-id` / `data-block-id`，所以这是“可改造”，不是“已支持”。

5. **是否适合做 AnyGen 式选区编辑层？**  
   **适合做第一阶段轻量选区编辑参考，不适合直接当完整 AnyGen runtime。**  
   原因是它已有文本点击编辑思路，但没有稳定 block schema、没有选区协议、没有模板切换与 content-model 绑定层。

结论：

- **不要把 frontend-slides 误判成现成 runtime 产品。**
- **也不要说它“不支持编辑”。它支持的是“可选文本级内联编辑”，不是“结构化多块编辑系统”。**

---

## 五、建议组合方案

1. **主生成器建议用谁**  
   **html-ppt-beautiful**  
   理由：它已经是 AIOS Web 当前入口，最容易扩成“单一主生成器 + 多模板内容模型”。

2. **模板库建议用谁**  
   **beautiful-html-templates**  
   理由：34 个模板、明确的模板选择索引、最适合承载“换模板不换内容模型”。

3. **播放/交互 runtime 建议用谁**  
   **第一阶段优先借 frontend-slides 的轻量播放 + 文本编辑思路；二阶段再参考 html-ppt-skill 的 presenter runtime。**

4. **图片生成参考建议用谁**  
   **guizang-ppt-skill**  
   理由：图片类型、比例、截图适配、封面生成经验最完整。

5. **Markdown/Marp 导出建议用谁**  
   **marp-slides**

6. **PPTX 导出建议用谁**  
   **marp-slides**  
   理由：实际文件里只有它明确给出 `--pptx` 导出路径。

7. **哪些暂时不要接**  
   - 不要把 `marp-slides` 当主 HTML PPT 生成器。  
   - 不要把 `guizang-ppt-skill` 当通用主生成器。  
   - 不要在第一阶段把 `html-ppt-skill` 整包硬接到现有 artifact-jobs。  
   - 不要把 `frontend-slides` 误当成现成可插拔 runtime 包。

8. **哪些只作为参考，不直接运行**  
   - `guizang-ppt-skill`：图片规划、截图适配、强版式约束  
   - `html-ppt-skill`：presenter mode、overview、主题/模板/runtime 设计  
   - `marp-slides`：Markdown/PPTX 导出链  

---

## 六、推荐流水线

推荐第一阶段流水线：

```text
用户需求
  -> 设计策略
  -> 模板选择（beautiful-html-templates/index.json）
  -> 内容模型 content-model.json
  -> 图片规划（自动配图或图片占位，比例跟模板槽位走）
  -> HTML PPT 生成（只允许一个主生成器写最终 HTML，建议 html-ppt-beautiful）
  -> 注入播放 runtime（轻量键盘/翻页/动画）
  -> 注入编辑 runtime（data-slide-id / data-block-id + 点击文本块替换）
  -> 输出 artifact（output/index.html）
  -> 可选导出 Marp/PPTX
```

更具体一点：

1. **用户需求**：输入 prompt / 大纲 / Markdown。  
2. **设计策略**：判断场景、密度、风格范围。  
3. **模板选择**：只从 `beautiful-html-templates` 选一个模板族，不要多 skill 抢写最终 HTML。  
4. **内容模型 `content-model.json`**：把 slide、block、image-slot、文本层级结构化。  
5. **图片规划**：先决定哪些 block 用图，哪些先放 placeholder。  
6. **HTML PPT 生成**：由 `html-ppt-beautiful` 统一渲染最终 `output/index.html`。  
7. **播放 runtime**：补最小翻页/动画/键盘支持。  
8. **编辑 runtime**：给 slide 和 block 注入稳定 ID，只做文本块点击替换。  
9. **输出 artifact**：一个最终 HTML artifact。  
10. **可选导出**：后续再转 Marp/PPTX，不进入第一阶段主链。  

---

## 七、第一阶段 MVP 建议

第一阶段只建议做下面这些，不要超 scope：

1. **多模板 HTML PPT**  
   以 `beautiful-html-templates` 为模板源，但最终只能有一个主生成器写 `output/index.html`。

2. **自动配图或图片占位**  
   先保证模板槽位、比例、占位稳定；真图生成可逐步打开。

3. **每个 slide 有 `data-slide-id`**  
   当前审计对象里没有现成实现，需要新增。

4. **每个文本/图片 block 有 `data-block-id`**  
   同样需要新增，作为后续局部编辑最小主键。

5. **支持点击文本块并局部替换文本**  
   第一阶段只做文本替换，不做自由排版。

6. **支持换模板时复用 `content-model.json`**  
   这是第一阶段最关键的中间层；没有它，就只是“换一套 prompt 重新生”。

7. **暂不做完整拖拽编辑器**  
   不做 block 拖拽、缩放、任意定位。

8. **暂不做复杂 PPTX 导出**  
   如需导出，第二阶段再考虑 `marp-slides` 或独立转换链。

我建议第一阶段的角色分工是：

- **html-ppt-beautiful**：唯一主生成器 / 最终写入者  
- **beautiful-html-templates**：模板源  
- **frontend-slides**：轻播放与文本编辑机制参考  
- **guizang-ppt-skill**：图片/截图/封面参考  
- **marp-slides**：导出链参考，不进入主生成链  

---

## 八、禁止事项

1. **不要修改 `ai-office-public-review`。**
2. **不要直接组合所有 skill。**
3. **不要让多个 skill 同时生成最终 `index.html`。**
4. **不要编造不存在的 API。**
5. **不要假设 `frontend-slides` 支持完整编辑器，必须按实际文件判断。**
6. **不要把 `marp-slides` 当作 HTML PPT 主生成器。**
7. **不要把 `guizang-ppt-skill` 和 `html-ppt-skill` 同时作为主生成器。**
8. **本轮只产出审计文档，不继续改业务代码。**

---

## 审计结论

### 最终判断

- **AIOS Web 当前最适合继续扩展的主入口：`html-ppt-beautiful`**
- **最适合做模板库：`beautiful-html-templates`**
- **最适合做轻播放/文本编辑参考：`frontend-slides`**
- **最适合做图片生成参考：`guizang-ppt-skill`**
- **最适合做 Markdown/PPTX 导出参考：`marp-slides`**
- **最强独立 studio 能力参考：`html-ppt-skill`**

### 为什么不是直接上 html-ppt-skill

不是因为它弱；相反，它最强。  
但对 `ai-office-web` 当前链路来说，它有三个现实问题：

1. **当前没接入**：没有 `metadata.json`，`skillRegistry.ts` 不会自动识别。  
2. **输出形态不合适**：它默认是多文件静态 deck，不是当前链路偏好的 `output/index.html` 单文件产物。  
3. **首期目标不需要它最重的能力**：presenter mode、overview、theme cycle 都很好，但第一阶段更该优先做模板切换、内容模型、局部文本替换。  

### 为什么主入口建议还是 html-ppt-beautiful

1. **它已经接在系统里。**
2. **它天然站在“模板库 + 单文件 HTML 输出”的方向上。**
3. **它更容易被扩成你现在要的 MVP：多模板、配图、局部文本替换、换模板复用 content-model。**

