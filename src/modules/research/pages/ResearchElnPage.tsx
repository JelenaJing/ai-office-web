import { ELNPage } from '../../materials-research/pages/ELNPage'
import '../research-eln-boost.css'

/** 科研模块内的实验记录本：整体字号加大两档 */
export default function ResearchElnPage() {
  return (
    <div className="research-eln-root flex min-h-0 w-full flex-1 flex-col overflow-auto pb-8">
      <ELNPage />
    </div>
  )
}
