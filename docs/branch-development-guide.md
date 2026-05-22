# Branch Development Guide

模块边界基线已经建立，后续并行开发默认按 **feature 模块** 分支协作，避免继续在 `App.tsx`、`PrimaryNav.tsx`、`platformApi` 上堆冲突。

## 分支建议

1. 基线分支：`feat/module-boundary-contracts`
2. 模块分支命名建议：
   - `feat/document-*`
   - `feat/ppt-*`
   - `feat/email-*`
   - `feat/aios-*`
   - `feat/resource-center-*`
3. 跨模块结构调整单独开分支：
   - `feat/core-contracts-*`
   - `feat/bridge-*`

## 目录所有权

| 模块 | 前端目录 | 服务端目录 |
| --- | --- | --- |
| document | `src/features/document/` | `server/src/features/document/` |
| ppt | `src/features/ppt/` | `server/src/features/ppt/` |
| email | `src/features/email/` | `server/src/features/email/` |
| aios | `src/features/aios/` | `server/src/features/aios/` |
| resource-center | `src/features/resource-center/` | `server/src/features/resource-center/` |
| core | `src/core/contracts/` | `server/src/shared/`, `server/src/lib/` |
| bridge | `src/bridges/` | - |

## 边界规则

1. feature 之间 **禁止 internal import**
   - 不允许：`src/features/email/... -> src/features/ppt/contexts/...`
   - 不允许：`src/features/ppt/... -> src/features/document/services/...`
2. 共享类型走 `src/core/contracts/`
3. 调用别的 feature 公开能力，只能走对方 `index.ts`
4. 跨模块数据转换走 `src/bridges/*`
5. `src/app/*` 只能引用 feature `manifest.ts` 或 public `index.ts`
6. `src/core/*` 不允许 import `src/features/*`

## 文稿转 PPT 规则

`document -> ppt` 不能直接互相依赖内部实现。

唯一允许路径：

1. document 输出 `DocumentOutline` / `DocumentArtifact`
2. `src/bridges/document-to-ppt/` 负责转换为 `DeckGenerationInput`
3. ppt 只消费 `DeckGenerationInput`

不要把文稿转 PPT 逻辑放回：

- `src/features/document/services/*`
- `src/features/ppt/services/*`
- `App.tsx`

## 提交前必须执行

在提交 PR 前，至少执行：

```bash
npm run check:boundaries
npm run build:web
cd server && npm run build
```

如果改了 `package.json` / lockfile，提交前确认依赖已经同步。

## 什么时候改 core / bridge

- **改 core/contracts**：当两个及以上模块需要共享稳定类型
- **改 feature index.ts**：当别的模块确实需要消费该模块公开能力
- **改 bridge**：当存在明确的跨模块转换流，例如 document -> ppt

如果只是模块内部实现，不要顺手改 `core/contracts`。

## CODEOWNERS 占位说明

当前 `CODEOWNERS` 使用的是占位名：

- `@document-owner`
- `@ppt-owner`
- `@email-owner`
- `@aios-owner`
- `@core-owner`

合并前需要替换成真实 GitHub 用户名或团队名。
