# humanizer（Document Studio 深度降重）

基于 [blader/humanizer](https://github.com/blader/humanizer) 理念：减少重复表达、优化句式、降低模板化痕迹，**保留原意**。

详细规则见同目录 `reference/SKILL.md`（若存在）。

## 工作目录

当前 job 根目录即工作区。所有路径均为**相对路径**：

- 输入：`input/selection.json`、`input/document-context.json`
- 技能：`.opencode/skills/humanizer/SKILL.md`（本文件）
- 输出：**必须**写入 `output/patch.json`

## 执行步骤

1. 使用 **Read** 读取 `input/selection.json` 与 `input/document-context.json`。
2. 仅对 `selection.text` 应用 humanizer 规则改写（可参考 `reference/SKILL.md`）。
3. 使用 **Write** 将结果写入 `output/patch.json`，格式如下（字段齐全）：

```json
{
  "type": "replace_selection",
  "text": "改写后的选区全文",
  "summary": ["已完成深度降重"],
  "warnings": []
}
```

## 禁止

- 不要运行 `opencode humanizer` 等 shell 子命令（不存在）。
- 不要读取 `/.opencode/...` 等根目录绝对路径；技能在 `.opencode/skills/humanizer/`。
- 不要输出完整文稿；**只允许** `output/patch.json` 作为交付物。
