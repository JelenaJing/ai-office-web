import type { ResearchWritingTask } from '../types'

interface ResearchWritingPanelProps {
  tasks: ResearchWritingTask[]
  selectedTaskId: string
  onSelectTask: (taskId: string) => void
}

export default function ResearchWritingPanel({
  tasks,
  selectedTaskId,
  onSelectTask,
}: ResearchWritingPanelProps) {
  const selectedTask = tasks.find(task => task.id === selectedTaskId) ?? tasks[0]

  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">报告 / 论文 / PPT 写作</h2>
          <p className="research-panel__subtitle">覆盖研究报告、论文大纲、组会 PPT 和项目申请书四类输出。</p>
        </div>
      </div>
      <div className="research-writing-actions">
        {tasks.map(task => (
          <button
            key={task.id}
            type="button"
            className={`research-button${task.id === selectedTaskId ? ' research-button--primary' : ''}`}
            onClick={() => onSelectTask(task.id)}
          >
            {task.label}
          </button>
        ))}
      </div>
      {selectedTask && (
        <div className="research-writing-preview">
          <strong>{selectedTask.label}</strong>
          <p>{selectedTask.description}</p>
          <div className="research-chip-row">
            <span className="research-chip research-chip--primary">输出类型：{selectedTask.output}</span>
            <span className="research-chip">本地 mock 预演</span>
            <span className="research-chip">不调用真实模型</span>
          </div>
        </div>
      )}
    </section>
  )
}
