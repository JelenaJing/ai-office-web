# Login Debug Report

## Summary

- **前端是否正常启动**：是。`dev:web` 指向 Vite Web 开发服务，地址为 `http://localhost:5173` / `http://10.20.5.61:5173`。
- **server 是否监听 3001**：是。单独启动 `cd server && npm run dev` 后，日志显示 `AIOS server running on http://0.0.0.0:3001`。
- **`/api/departments` 是否可访问**：是。`curl http://127.0.0.1:3001/api/departments` 返回 `200 OK`。
- **`/api/auth/login` 是否到达 server**：是。`POST http://127.0.0.1:3001/api/auth/login` 能返回来自上游的 `401 Invalid credentials`。
- **AccountCenter 是否可达**：是。`POST http://10.20.5.61:13100/api/auth/login` 可直接返回 `401 Invalid credentials`；`GET` 该地址返回 `404`，说明该接口仅支持 `POST`。
- **yifeichen 登录失败原因**：当前已确认两类原因中至少有一类成立：
  1. **此前只启动了 `dev:web`，没有启动本地 server**，导致 Vite `/api` 代理到 `127.0.0.1:3001` 时 `ECONNREFUSED`，此时登录必然失败。
  2. **当 server 正常启动后，登录是否成功取决于 AccountCenter 是否接受该账号密码**。本次未持有真实密码，无法验证 `yifeichen` 的实际凭据是否正确；但链路已经确认通畅，若仍失败，最可能是 **AccountCenter 返回 401（账号/密码问题）**，而不是前端 token 保存问题。

## Checks Performed

### 1. Git / Branch State

- 当前分支：`main`
- 当前最新提交：`cddadbb`
- 工作区状态：干净

最近 5 个提交：

1. `cddadbb` Merge branch 'feat/module-boundary-contracts'
2. `ba2a0a7` fix(document): include pending editor UX files
3. `bf5d47b` feat(document): DOCX import + knowledge context transparency
4. `8e9ee49` feat(document): AI assistant card polish + onExportRequest prop
5. `572f6c8` feat(document): character-level typewriter effect for AI draft generation

### 2. package.json Scripts

根目录 `package.json` 中相关脚本：

- `dev:web`: `vite --config vite.web.config.ts --host 0.0.0.0`
- `dev:server`: `cd server && npm run dev`
- `dev:web:full`: `concurrently -n web,server -c cyan,yellow "npm run dev:web" "npm run dev:server"`

结论：

- `npm run dev:web` **只启动前端 5173**
- `npm run dev:server` **只启动 server 3001**
- `npm run dev:web:full` **会同时启动 web + server**

### 3. Server Startup

执行：

```bash
cd server
npm run dev
```

实际日志：

```text
🚀 AIOS server running on http://0.0.0.0:3001
   AccountCenter proxy → http://10.20.5.61:13100
```

结论：**server 能正常启动，3001 正常监听。**

### 4. Local API Probe

执行：

```bash
curl -i http://127.0.0.1:3001/api/departments
```

结果：`200 OK`

结论：**此前的 `ECONNREFUSED 127.0.0.1:3001` 不是现在的持续性故障，而是“当时 server 没启动”。**

### 5. Auth Route Inspection

文件：`server/src/routes/auth.ts`

确认结果：

- `/api/auth/login` **代理到** `ACCOUNT_CENTER_URL + '/api/auth/login'`
- 默认 `ACCOUNT_CENTER_URL` 是 **`http://10.20.5.61:13100`**
- server 接受：
  - `{ username, password }`
  - `{ email, password }`
- server 会统一转发为：
  - `{ username, password }`

因此：

- **前端字段与 server 期望并不冲突**
- `yifeichen` 作为 username 提交是可以的
- 这不是 “username/email 字段不匹配” 的问题

### 6. AccountCenter Reachability

执行：

```bash
curl -i http://10.20.5.61:13100/api/auth/login
```

结果：`404 Not Found`

说明：该接口不支持 `GET`，只支持 `POST`。

执行：

```bash
curl -i -X POST http://10.20.5.61:13100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"yifeichen","password":"__invalid__"}'
```

结果：`401 Unauthorized`

响应体：

```json
{"error":"Invalid credentials"}
```

结论：

- **AccountCenter 可达**
- 地址 **不是错的**
- 代理链路 **不是断的**
- 401 表明上游认证服务在工作，只是当前凭据被拒绝

### 7. server Environment

检查到：

- `server/.env.local` 存在
- `server/.env` 不存在
- `.env.local` 中可见：
  - `RATE_LIMIT_AUTH_SKIP_LOCALHOST=true`

未在 `.env.local` 中看到以下显式配置：

- `ACCOUNT_CENTER_URL=`
- `JWT_SECRET=`
- `EMAIL_SECRET=`

当前行为来自代码默认值：

- `ACCOUNT_CENTER_URL` 默认回退到 `http://10.20.5.61:13100`

### 8. Frontend Login Flow

相关文件：

- `src/components/LoginGate.tsx`
- `src/contexts/InternalAccountContext.tsx`
- `src/services/accountCenterClient.ts`
- `src/accountCenterConfig.ts`
- `src/runtime/electronAPIShim.ts`
- `src/App.tsx`

确认结果：

1. 登录页 `LoginGate` 提交 `login(username, password)`
2. `InternalAccountContext` 调用 `accountCenterClient.login(username, password)`
3. `accountCenterClient` 在 Web 模式下通过 `getAccountCenterBaseUrl()` 返回空串 `''`
4. 实际请求发往 **同源** `/api/auth/login`
5. Vite `vite.web.config.ts` 将 `/api` 代理到 **`http://localhost:3001`**
6. 登录成功后：
   - token 会通过 web shim 的 `internalAccountSetToken()` 存入 `localStorage` key `aios_itoken`
   - state 切到 `logged_in`
   - `App.tsx` 不再渲染 `LoginGate`，进入主工作区

结论：

- **前端会正确调用登录接口**
- **前端有 token 保存逻辑**
- **前端有登录后跳转逻辑**
- 代码层面**没有看到“登录成功但不保存 token / 不跳转”的明显问题**

### 9. Server Logs During Login Failure

本次 server 日志仅看到：

```text
[departments] list ok user=web-demo-user count=30
```

未看到：

- `[auth-proxy] ...`
- `AccountCenter 不可达`
- `502`

原因是：

- `server/src/routes/auth.ts` 只在 **代理异常 / 网络失败** 时打印 `[auth-proxy]`
- **正常的 401 上游响应不会被打印成错误日志**

所以：

- **没有 auth 错误日志 ≠ 登录请求没到达 server**
- 当前更像是 **请求已到达上游，但被上游认证拒绝**

## Root Cause Assessment

### 已确认的问题

1. **开发方式问题**
   - 如果只执行 `npm run dev:web`，前端会起在 `5173`
   - 但 `/api/*` 仍会代理到 `localhost:3001`
   - 若没同时启动 `server`，就会出现：
     - `/api/departments proxy error: ECONNREFUSED 127.0.0.1:3001`
     - 登录失败

2. **当前链路问题不是前端字段或代理地址**
   - 前端发 `/api/auth/login`
   - 本地 server 能接到
   - server 能转发到 `10.20.5.61:13100`
   - AccountCenter 能响应

### 对 `yifeichen` 当前登录失败的最可能解释

按概率排序：

1. **启动方式错误**：只跑了 `dev:web`，没跑 `server`
2. **真实密码被 AccountCenter 拒绝**：若现在使用 `dev:web:full` 或同时启动 server 仍失败，则最可能是这一项
3. **前端 token 保存问题**：当前代码检查下 **不支持这个判断**
4. **AccountCenter 地址/代理问题**：当前已排除

## Recommended Fix

### 立即操作

1. **开发时不要只跑 `npm run dev:web`**
2. 改为执行：

```bash
npm run dev:web:full
```

或分别开两个终端：

```bash
npm run dev:web
npm run dev:server
```

### 若 server 已启动但仍登录失败

下一步应验证：

1. 用 **同一组真实账号密码** 直接请求 AccountCenter：

```bash
curl -i -X POST http://10.20.5.61:13100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"yifeichen","password":"<真实密码>"}'
```

2. 结果判断：
   - `200`：账号密码正确，问题再回头查前端会话恢复/页面状态
   - `401/403`：**账号或密码问题**
   - `502/timeout/refused`：**AccountCenter 环境问题**

## Final Diagnosis

- **这不是前端页面本身起不来的问题**
- **这不是 `/api/auth/login` 字段不匹配问题**
- **这不是 AccountCenter 地址写错问题**
- **此前的 `ECONNREFUSED` 根因是本地 server 没启动**
- **若现在 server 已启动仍然无法登录，最可能是 AccountCenter 对 `yifeichen` 的真实凭据返回了 401**
