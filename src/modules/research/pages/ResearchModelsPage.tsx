import { App as Ai4ScienceBatteryApp } from '@ai4science/pages/App'
import '@ai4science/styles.css'
import './ai4science-embed.css'

/** 科研「模型」：内嵌 ai4science 电池寿命工作台（非 iframe） */
export default function ResearchModelsPage() {
  return (
    <div className="ai4science-embed research-models-root min-h-0 w-full flex-1">
      <Ai4ScienceBatteryApp />
    </div>
  )
}
