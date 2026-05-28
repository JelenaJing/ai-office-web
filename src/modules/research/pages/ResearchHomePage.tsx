import { useInternalSession } from '../../../contexts/InternalAccountContext'
import { resolveResearchPersona } from '../researchPersona'
import ResearchStudentHomePage from './ResearchStudentHomePage'
import ResearchTeacherHomePage from './ResearchTeacherHomePage'

/** 按账户角色展示不同首页（学生 / 导师） */
export default function ResearchHomePage() {
  const session = useInternalSession()
  if (!session?.user) {
    return <p className="text-[14px] text-slate-500">正在加载账户信息…</p>
  }

  const persona = resolveResearchPersona(session.user)
  if (persona === 'teacher') {
    return <ResearchTeacherHomePage />
  }
  return <ResearchStudentHomePage />
}
