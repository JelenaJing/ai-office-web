import { useState } from 'react'
import styled from 'styled-components'
import AiClassPortal from './AiClassPortal'
import AiClassCourseViewer from './AiClassCourseViewer'
import type { AiClassCourse } from '../data/aiClassCourses'

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
`

export default function AiClassWorkbench() {
  const [activeCourse, setActiveCourse] = useState<AiClassCourse | null>(null)

  return (
    <Shell>
      {activeCourse ? (
        <AiClassCourseViewer course={activeCourse} onBack={() => setActiveCourse(null)} />
      ) : (
        <AiClassPortal onSelectCourse={setActiveCourse} />
      )}
    </Shell>
  )
}
