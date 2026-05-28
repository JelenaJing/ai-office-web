import { useEffect } from 'react'
import { useInternalSession } from '../../../contexts/InternalAccountContext'
import { useSessionStore } from '../../materials-research/store/sessionStore'
import type { StudentProfile, User } from '../../materials-research/types/user'
import { mapToMaterialsRole, resolveResearchPersona } from '../researchPersona'

function buildMaterialsUser(account: {
  id: string
  email: string
  displayName?: string
  username?: string
  roles?: string[]
}): User {
  const now = new Date().toISOString()
  const persona = resolveResearchPersona({
    id: account.id,
    username: account.username ?? account.email,
    displayName: account.displayName ?? account.username ?? account.email,
    email: account.email,
    roles: account.roles ?? [],
    status: 'active',
    mustChangePassword: false,
  })
  const role = mapToMaterialsRole(persona)
  return {
    id: account.id,
    name: account.displayName || account.username || account.email,
    email: account.email,
    role,
    groupId: 'default-research-group',
    keywords: [],
    researchDirection: role === 'student' ? 'polymer_battery' : undefined,
    createdAt: now,
    lastLoginAt: now,
  }
}

function buildStudentProfile(userId: string): StudentProfile {
  return {
    userId,
    studentNo: '—',
    advisorId: 'advisor-default',
    researchDirection: 'polymer_battery',
    projectTitle: '材料与能源交叉研发课题',
    focusMetrics: ['循环稳定性', '首效', '离子电导'],
    uploadedPaperCount: 0,
    experimentRecordCount: 0,
    pendingReviewCount: 0,
    dataCompletenessScore: 72,
  }
}

/** 将主站 AccountCenter 会话同步到材料研发工作台（不经过平台独立登录页） */
export function useResearchSessionBridge(): void {
  const session = useInternalSession()

  useEffect(() => {
    if (!session?.user) {
      useSessionStore.setState({ user: null, studentProfile: null })
      return
    }
    const user = buildMaterialsUser({
      ...session.user,
      roles: session.user.roles,
    })
    useSessionStore.setState({
      user,
      studentProfile: user.role === 'student' ? buildStudentProfile(user.id) : null,
      onboardingDone: true,
    })
  }, [session?.user?.id, session?.user?.email, session?.user?.displayName, session?.user?.roles])
}
