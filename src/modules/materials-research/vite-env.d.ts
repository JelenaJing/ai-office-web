/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 交付构建：锁定租户，如 ustc-advanced | quantum-center | generic */
  readonly VITE_TENANT_ID?: string;
  /** 开发调试：在已锁定租户时仍显示切换器（仅本地使用） */
  readonly VITE_ENABLE_TENANT_SWITCHER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
