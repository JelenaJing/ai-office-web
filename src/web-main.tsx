/**
 * web-main.tsx — Web 模式入口
 *
 * 1. 安装 electronAPI shim（使业务代码在浏览器中不会因缺少 electronAPI 而崩溃）
 * 2. 使用与桌面版相同的 Provider 树 + App 组件，保留全部业务 UI
 */

// 必须在任何业务代码之前安装 shim
import { installWebElectronAPIShim } from './runtime/electronAPIShim'
installWebElectronAPIShim()

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary'
import { DocumentProvider } from './contexts/DocumentContext'
import { DepartmentProvider } from './contexts/DepartmentContext'
import { KnowledgeProvider } from './contexts/KnowledgeContext'
import { PersonalLibraryProvider } from './contexts/PersonalLibraryContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { EditorSessionProvider } from './contexts/EditorSessionContext'
import { InternalAccountProvider } from './contexts/InternalAccountContext'
import { MatrixChatProvider } from './contexts/MatrixChatContext'
import { DocumentWorkspaceKnowledgeProvider } from './contexts/DocumentWorkspaceContext'
import './index.css'
import 'katex/dist/katex.min.css'

// 捕获全局错误，防止白屏
window.addEventListener('error', (event) => {
  console.error('[GlobalError]', event.error ?? event.message)
  event.preventDefault()
})
window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledRejection]', event.reason)
  event.preventDefault()
})

// 恢复显示缩放偏好
const _storedScale = localStorage.getItem('aioffice.displayScale')
if (_storedScale) {
  document.documentElement.style.zoom = _storedScale
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement, {
  onRecoverableError(error, errorInfo) {
    console.error('[ReactRecoverableError]', error, errorInfo)
  },
}).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <LanguageProvider>
        <InternalAccountProvider>
          <MatrixChatProvider>
            <WorkspaceProvider>
              <DocumentProvider>
                <EditorSessionProvider>
                  <DepartmentProvider>
                    <KnowledgeProvider>
                      <PersonalLibraryProvider>
                        <DocumentWorkspaceKnowledgeProvider>
                          <App />
                        </DocumentWorkspaceKnowledgeProvider>
                      </PersonalLibraryProvider>
                    </KnowledgeProvider>
                  </DepartmentProvider>
                </EditorSessionProvider>
              </DocumentProvider>
            </WorkspaceProvider>
          </MatrixChatProvider>
        </InternalAccountProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
