import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { Beaker, Brain, Layers } from 'lucide-react'
import {
  AI_CLASS_CATEGORIES,
  AI_CLASS_COURSES,
  type AiClassCategoryId,
  type AiClassCourse,
} from '../data/aiClassCourses'

const Page = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #ffffff;
  font-family: 'Google Sans', 'Roboto', 'Noto Sans SC', 'PingFang SC', system-ui, sans-serif;
`

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 24px 48px;
`

const Hero = styled.header`
  text-align: center;
  margin-bottom: 28px;
`

const HeroTitle = styled.h1`
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1a1a1a;
`

const HeroSubtitle = styled.p`
  margin: 0;
  font-size: 15px;
  color: #5f6368;
  line-height: 1.5;
`

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
`

const FilterPill = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  background: ${({ $active }) => ($active ? '#2d2d2d' : '#f1f3f4')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#3c4043')};

  &:hover {
    background: ${({ $active }) => ($active ? '#1a1a1a' : '#e8eaed')};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
  gap: 20px;
`

const CardButton = styled.button`
  display: flex;
  flex-direction: column;
  text-align: left;
  border: 1.5px solid #e07a5f;
  border-radius: 16px;
  background: #ffffff;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(224, 122, 95, 0.18);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #e07a5f;
    outline-offset: 2px;
  }
`

const CardTop = styled.div`
  padding: 18px 18px 14px;
  flex: 1;
`

const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: #c45c3e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const CardTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  color: #1a1a1a;
`

const CardMeta = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #5f6368;
`

const CardArt = styled.div<{ $tone: string }>`
  height: 140px;
  background: ${({ $tone }) => $tone};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
`

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px 24px;
  color: #5f6368;
  font-size: 15px;
`

interface AiClassPortalProps {
  onSelectCourse: (course: AiClassCourse) => void
}

function categoryIcon(category: AiClassCourse['category']) {
  if (category === 'chemistry') return <Beaker size={14} strokeWidth={2.2} />
  if (category === 'materials') return <Layers size={14} strokeWidth={2.2} />
  return <Brain size={14} strokeWidth={2.2} />
}

function courseIllustration(course: AiClassCourse) {
  if (course.id === 'material-chemistry-ai-lectures') {
    return (
      <svg width="200" height="110" viewBox="0 0 200 110" aria-hidden>
        <rect x="24" y="52" width="48" height="40" rx="8" fill="#fde68a" />
        <rect x="76" y="38" width="48" height="54" rx="8" fill="#93c5fd" />
        <rect x="128" y="48" width="48" height="44" rx="8" fill="#fca5a5" />
        <circle cx="48" cy="44" r="14" fill="#fbbf24" opacity="0.9" />
        <path d="M88 28 L104 20 L120 28 L104 36 Z" fill="#3b82f6" />
        <text x="100" y="78" textAnchor="middle" fontSize="11" fill="#1e3a5f" fontWeight="700">
          AI × 材料化学
        </text>
        <text x="100" y="94" textAnchor="middle" fontSize="10" fill="#475569">
          4 讲课程
        </text>
      </svg>
    )
  }
  return null
}

function artTone(category: AiClassCourse['category']) {
  if (category === 'chemistry') return 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)'
  if (category === 'materials') return 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)'
  return 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)'
}

export default function AiClassPortal({ onSelectCourse }: AiClassPortalProps) {
  const [activeCategory, setActiveCategory] = useState<AiClassCategoryId>('all')

  const visibleCourses = useMemo(() => {
    if (activeCategory === 'all') return AI_CLASS_COURSES
    return AI_CLASS_COURSES.filter(c => c.category === activeCategory)
  }, [activeCategory])

  return (
    <Page>
      <Inner>
        <Hero>
          <HeroTitle>AI 课堂</HeroTitle>
          <HeroSubtitle>探索互动课程，按学科筛选并开始学习</HeroSubtitle>
        </Hero>

        <FilterRow>
          {AI_CLASS_CATEGORIES.map(cat => (
            <FilterPill
              key={cat.id}
              type="button"
              $active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </FilterPill>
          ))}
        </FilterRow>

        <Grid>
          {visibleCourses.length === 0 ? (
            <EmptyState>该分类下暂无课程</EmptyState>
          ) : (
            visibleCourses.map(course => (
              <CardButton
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course)}
              >
                <CardTop>
                  <CategoryRow>
                    {categoryIcon(course.category)}
                    <span>{course.categoryLabel}</span>
                  </CategoryRow>
                  <CardTitle>{course.title}</CardTitle>
                  <CardMeta>
                    {course.lectureCount} 讲 · {course.description}
                  </CardMeta>
                </CardTop>
                <CardArt $tone={artTone(course.category)}>
                  {courseIllustration(course)}
                </CardArt>
              </CardButton>
            ))
          )}
        </Grid>
      </Inner>
    </Page>
  )
}
