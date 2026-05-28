import type { InternalAccountUser } from '../../types/internalAccount'
import type { UserRole } from '../materials-research/types/user'

export type ResearchPersona = 'student' | 'teacher'

export function resolveResearchPersona(user: InternalAccountUser): ResearchPersona {
  const roles = user.roles ?? []
  if (
    roles.some(r =>
      ['teacher', 'admin', 'super_admin', 'system_admin', 'instructor'].includes(r),
    )
  ) {
    return 'teacher'
  }
  return 'student'
}

export function mapToMaterialsRole(persona: ResearchPersona): UserRole {
  return persona === 'teacher' ? 'teacher' : 'student'
}
