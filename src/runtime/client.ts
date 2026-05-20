/**
 * client.ts — Web 运行时统一导出
 *
 * 业务代码通过此入口使用运行时工具，避免直接依赖底层实现。
 *
 * 示例：
 *   import { isWeb, apiGet, apiPost } from '@/runtime/client'
 */

export { getRuntimeEnv, isWeb, isDesktop } from './runtimeEnv'
export { apiGet, apiPost } from './webClient'
