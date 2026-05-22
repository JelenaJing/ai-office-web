# Login Unification Report

## Why there were two login pages

Web 端此前同时保留了两套登录体系：

1. **当前主入口**
   - `src/web-main.tsx`
   - `src/App.tsx`
   - `src/components/LoginGate.tsx`
   - `src/contexts/InternalAccountContext.tsx`

   这套入口才是 `index.web.html` 当前真正加载的主流程。未登录时，`App.tsx` 会直接渲染 `LoginGate`。

2. **旧 Web MVP 入口**
   - `src/web/WebApp.tsx`
   - `src/web/pages/LoginPage.tsx`
   - `src/web/components/RequireAuth.tsx`

   这套旧代码仍然保留了 `AIOS / AI Office Suite` 紫色登录页，并且依赖 `platformApi.auth.*` 的另一套判断逻辑。虽然它不是当前 `index.web.html` 的实际入口，但代码中仍存在，容易造成混淆，也可能在旧路由或历史代码中被再次引用。

## Final unified login entry

最终统一为：

- **唯一登录 UI**：`src/components/LoginGate.tsx`
- **唯一登录状态来源**：`src/contexts/InternalAccountContext.tsx`
- **Web 主入口**：`src/web-main.tsx -> src/App.tsx`

处理结果：

- Web 未登录时统一显示 `LoginGate`
- `/login` 旧路由改为直接渲染 `LoginGate`
- `src/web/pages/LoginPage.tsx` 保留文件，但仅作为 `LoginGate` 包装层，不再保留第二套紫色登录逻辑
- `src/web/components/RequireAuth.tsx` 改为使用 `InternalAccountContext`
- `src/web/pages/AiosHomePage.tsx` 改为使用 `InternalAccountContext` 读用户和退出登录，去掉第二套 `platformApi.auth` 登录态来源

## Token persistence keys

登录成功后，现在会同时写入这些 key：

- `aios_auth_token`
- `aios_auth_user`
- `aios_itoken`
- `ai_office_internal_token`

用途：

- `aios_auth_token` / `aios_auth_user`：供 `webPlatformApi` 与 Web 功能模块读取
- `aios_itoken`：兼容 Web shim 的 `internalAccountGetToken/internalAccountSetToken`
- `ai_office_internal_token`：兼容 legacy 读取路径

恢复登录态时：

- `InternalAccountContext.readStoredToken()` 会按上述多 key 顺序读取并恢复
- 成功调用 `/api/auth/me` 后，会再次回写统一 token/user key，避免刷新后只有旧 key 没有新 key 的情况

## Login copy updates

`LoginGate` 输入框文案已统一为：

- Label：`用户名或邮箱`
- Placeholder：`请输入用户名或 AI Office 邮箱`

因此以下两种输入都走同一套 `/api/auth/login`：

- `yifeichen`
- `yifeichen@ai.cuhk.edu.cn`

## Error handling updates

登录错误提示统一为：

- 无法连接本地 Web 后端：`无法连接 Web 后端，请确认 server 3001 已启动`
- 401 / 403：`账号或密码错误`
- 502：`AccountCenter 不可达`

这样登录失败时不会一直卡在“登录中”。

## Validation results

### Build / checks

- `npm run check:boundaries` ✅
- `npm run build:web` ✅
- `cd server && npm run build` ✅

### Runtime checks

已验证：

1. `http://127.0.0.1:5173/index.web.html` 可访问，返回 `200`
2. `http://127.0.0.1:5173/login` 可访问，返回 `200`
3. 通过 **Vite `/api` 代理** 的真实登录请求已成功：

#### Username login

```http
POST http://127.0.0.1:5173/api/auth/login
Content-Type: application/json

{"username":"yifeichen","password":"12345678"}
```

结果：`200 OK`

#### Email login

```http
POST http://127.0.0.1:5173/api/auth/login
Content-Type: application/json

{"email":"yifeichen@ai.cuhk.edu.cn","password":"12345678"}
```

结果：`200 OK`

### Notes about dev ports

验证时发现当前环境里已有现成进程占用了：

- `3001`
- `5173`

因此新开的临时 dev 进程分别出现了：

- `server`: `EADDRINUSE: 3001`
- `vite`: 自动切到 `5174`

但这不影响结论，因为现有 `3001/5173` 进程已成功完成：

- 页面访问
- `/login` 路径访问
- `/api/auth/login` 代理登录

## Final result

Web 登录现在已统一到 **LoginGate + InternalAccountContext + /api/auth/login** 这一条链路。

当前保留的唯一登录体验是 **AI Office / AccountCenter 内部账号登录页**。
