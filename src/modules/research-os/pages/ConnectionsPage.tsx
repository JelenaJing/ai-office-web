import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import { OsChrome } from '../components/OsChrome'
import { ProjectSidebar } from '../components/ProjectSidebar'
import { ResearchFlowNode } from '../components/nodes/ResearchFlowNode'
import { useProjectStore } from '../store/projectStore'

const nodeTypes = { researchNode: ResearchFlowNode }

export default function ConnectionsPage() {
  const nodes = useProjectStore(s => s.nodes)
  const edges = useProjectStore(s => s.edges)
  const setGraph = useProjectStore(s => s.setGraph)
  const pushHistory = useProjectStore(s => s.pushHistory)
  const editMode = useProjectStore(s => s.editMode)

  const onNodesChange: OnNodesChange = useCallback(
    changes => setGraph(applyNodeChanges(changes, nodes), edges),
    [nodes, edges, setGraph],
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setGraph(nodes, applyEdgeChanges(changes, edges)),
    [nodes, edges, setGraph],
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      pushHistory()
      setGraph(nodes, addEdge({ ...connection, animated: true, style: { stroke: '#0066ff', strokeWidth: 2 } }, edges))
    },
    [nodes, edges, pushHistory, setGraph],
  )

  return (
    <OsChrome>
      <div className="os-body-row bg-[#eef2f7]">
        <ProjectSidebar />
        <div className="os-canvas-wrap min-h-0 flex-1 bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={editMode ? onConnect : undefined}
            nodesDraggable={editMode}
            nodesConnectable={editMode}
            elementsSelectable
            deleteKeyCode={editMode ? ['Backspace', 'Delete'] : null}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} color="#cbd5e1" />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
    </OsChrome>
  )
}
