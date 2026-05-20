/**
 * MyFilesPanel — modal overlay for file management.
 *
 * Wraps the shared MyFilesView in a centered modal.
 * File list logic lives in src/components/resource/MyFilesView.tsx.
 */

import { X } from 'lucide-react'
import MyFilesView from '../components/resource/MyFilesView'

interface MyFilesPanelProps {
  onClose: () => void
}

export default function MyFilesPanel({ onClose }: MyFilesPanelProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 30, 55, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 12px 48px rgba(20, 40, 80, 0.18)',
        width: 720, maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 80px)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid #e8eef5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2f47' }}>我的文件</div>
            <div style={{ fontSize: 12, color: '#8094a8', marginTop: 2 }}>
              支持 docx、pdf、pptx、xlsx、csv、txt、md、png、jpg
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, border: 'none',
              background: '#f0f4f8', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="#627385" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MyFilesView fullHeight />
        </div>
      </div>
    </div>
  )
}
