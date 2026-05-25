function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export function toJsonSafe(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map((item) => toJsonSafe(item, seen))
  if (isObjectRecord(value)) {
    if (seen.has(value)) return seen.get(value)
    const out: Record<string, unknown> = {}
    seen.set(value, out)
    for (const [key, entry] of Object.entries(value)) {
      out[key] = toJsonSafe(entry, seen)
    }
    return out
  }
  return value
}

export function stringifyJsonSafe(value: unknown, space?: string | number): string {
  return JSON.stringify(toJsonSafe(value), null, space)
}

export function findBigIntPaths(
  value: unknown,
  basePath = '$',
  seen = new WeakSet<object>(),
): string[] {
  if (typeof value === 'bigint') return [basePath]
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findBigIntPaths(item, `${basePath}[${index}]`, seen))
  }
  if (isObjectRecord(value)) {
    if (seen.has(value)) return []
    seen.add(value)
    return Object.entries(value).flatMap(([key, entry]) => findBigIntPaths(entry, `${basePath}.${key}`, seen))
  }
  return []
}
