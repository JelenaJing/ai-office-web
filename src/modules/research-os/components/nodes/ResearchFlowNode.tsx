import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import { LEX } from '../../config/materialsLexicon'

export type PortSignal = 'ANALOG' | 'DIGITAL' | 'CONTROL'

export interface ResearchNodeData {
  kind: 'device' | 'control'
  title: string
  modelId: string
  ports: { id: string; label: string; signal: PortSignal }[]
}

const signalLabel: Record<PortSignal, string> = {
  ANALOG: LEX.signalAnalog,
  DIGITAL: LEX.signalDigital,
  CONTROL: LEX.signalControl,
}

const signalClass: Record<PortSignal, string> = {
  ANALOG: 'donut-pill-analog',
  DIGITAL: 'donut-pill-digital',
  CONTROL: 'donut-pill-pwm',
}

export function ResearchFlowNode({ data }: NodeProps) {
  const nodeData = data as unknown as ResearchNodeData
  const isControl = nodeData.kind === 'control'

  return (
    <div className="min-w-[300px] rounded-xl border-2 border-slate-200 bg-white shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="donut-text-h2 text-slate-900">{nodeData.title}</p>
          <p className="mt-1 donut-text-caption">{nodeData.modelId}</p>
        </div>
        <span className="donut-pill bg-slate-200 text-slate-800">{isControl ? LEX.control : LEX.device}</span>
      </div>
      <div className="px-5 py-3">
        <p className="donut-text-label font-bold text-slate-600">{LEX.interfaces}</p>
        <ul className="mt-2 space-y-2">
          {nodeData.ports.map(port => {
            const isIn = port.id.includes('In') || port.label.includes('输入')
            return (
              <li
                key={port.id}
                className="relative flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <Handle
                  type={isIn ? 'target' : 'source'}
                  position={isIn ? Position.Left : Position.Right}
                  id={port.id}
                  className="!h-5 !w-5 !border-[3px] !border-blue-600 !bg-white"
                />
                <span className="donut-text-label font-semibold text-slate-900">{port.label}</span>
                <span className={clsx('donut-pill', signalClass[port.signal])}>{signalLabel[port.signal]}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
