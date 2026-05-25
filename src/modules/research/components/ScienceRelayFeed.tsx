import ResearchIdeaCard from './ResearchIdeaCard'
import type { ResearchIdeaCard as ResearchIdeaCardData } from '../types'

interface ScienceRelayFeedProps {
  ideas: ResearchIdeaCardData[]
  selectedIdeaId: string
  onSelectIdea: (ideaId: string) => void
  onConvertIdea: (ideaId: string) => void
}

export default function ScienceRelayFeed({
  ideas,
  selectedIdeaId,
  onSelectIdea,
  onConvertIdea,
}: ScienceRelayFeedProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">Science Relay / 科研 Idea Feed</h2>
          <p className="research-panel__subtitle">
            这里不是普通帖子流，而是从论文证据抽取、结构化整理后的科研 Idea Feed。
          </p>
        </div>
      </div>
      <div className="research-list">
        {ideas.map(idea => (
          <ResearchIdeaCard
            key={idea.id}
            idea={idea}
            selected={idea.id === selectedIdeaId}
            onSelect={() => onSelectIdea(idea.id)}
            onConvert={() => onConvertIdea(idea.id)}
          />
        ))}
      </div>
    </section>
  )
}
