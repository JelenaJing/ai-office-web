# PR Checklist

提交前请逐项确认：

- [ ] 本次改动是否只覆盖自己的模块目录
- [ ] 如果跨模块，是否通过 `src/core/contracts/`、feature `index.ts` 或 `src/bridges/*`
- [ ] 是否新增或修改了 `core contract`
- [ ] 如果改了 bridge，是否说明了输入/输出 contract 变化
- [ ] 是否运行 `npm run check:boundaries`
- [ ] 是否运行 `npm run build:web`
- [ ] 是否运行 `cd server && npm run build`
- [ ] 是否引入了新的 `window.electronAPI` 业务依赖
- [ ] 是否改动了 `App.tsx` / `PrimaryNav.tsx`，如果改了是否说明原因
- [ ] 是否更新相关 manifest / registry（如果本次新增模块入口）

## 额外提示

1. feature 之间禁止 internal import
2. document -> ppt 必须走 `src/bridges/document-to-ppt/`
3. 占位 `CODEOWNERS` 需要在正式团队协作前替换为真实 GitHub 账号
