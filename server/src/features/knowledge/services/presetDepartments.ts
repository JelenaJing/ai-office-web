/** Preset department hierarchy — mirrors electron/main/services/departmentService.ts */
export const PRESET_DEPARTMENT_PARENTS: Record<string, string> = {
  sai: 'cuhksz',
  clear: 'cuhksz',
  bfmo: 'cuhksz',
  'ai-reading': 'cuhksz',
  'classic-reading': 'ai-reading',
  'scientific-papers': 'ai-reading',
  aso: 'cuhksz',
  zhaoban: 'cuhksz',
  cuhksz_course: 'cuhksz',
}

export function applyPresetHierarchy<T extends { id: string; parentId?: string }>(
  departments: T[],
): T[] {
  return departments.map((dept) => {
    const parentId = PRESET_DEPARTMENT_PARENTS[dept.id]
    return parentId ? { ...dept, parentId } : dept
  })
}

/** Same partition resolution as Electron main process. */
export function resolveRemoteKnowledgePartitionId(
  departmentId: string,
  nameEn?: string,
): string {
  if (
    departmentId === 'classic-reading' ||
    departmentId === 'scientific-papers'
  ) {
    return departmentId
  }
  if (nameEn === 'classic-reading' || nameEn === 'scientific-papers') {
    return nameEn
  }
  return departmentId
}
