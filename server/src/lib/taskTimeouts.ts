export const TASK_TIMEOUTS = {
  default: 300_000,
  document: 300_000,
  ppt: 300_000,
  deck: 300_000,
  html_ppt: 300_000,
  html_to_pptx: 300_000,
  html_render: 300_000,
  email: 300_000,
  image: 900_000,
  poster: 900_000,
  vision: 900_000,
} as const

export type ServerTaskTimeoutType = keyof typeof TASK_TIMEOUTS

const IMAGE_TASK_TYPES = new Set<ServerTaskTimeoutType>(['image', 'poster', 'vision'])

export function resolveTaskTimeoutMs(taskType?: string | null): number {
  const normalized = String(taskType || '').trim().toLowerCase().replace(/-/g, '_') as ServerTaskTimeoutType
  return TASK_TIMEOUTS[normalized] ?? TASK_TIMEOUTS.default
}

export function isImageTaskTimeoutType(taskType?: string | null): boolean {
  const normalized = String(taskType || '').trim().toLowerCase().replace(/-/g, '_') as ServerTaskTimeoutType
  return IMAGE_TASK_TYPES.has(normalized)
}

