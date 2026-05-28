import { useCallback, useState } from 'react'
import type { Editor } from '@tiptap/react'

export interface DocumentSelectionState {
  from: number
  to: number
  text: string
  blockIds: string[]
}

export function useDocumentSelection() {
  const [selection, setSelection] = useState<DocumentSelectionState | null>(null)

  const syncFromEditor = useCallback((editor: Editor | null) => {
    if (!editor) {
      setSelection(null)
      return
    }
    const { from, to, empty } = editor.state.selection
    if (empty) {
      setSelection(null)
      return
    }
    const text = editor.state.doc.textBetween(from, to, '\n')
    const blockIds: string[] = []
    editor.state.doc.nodesBetween(from, to, node => {
      if (node.attrs?.blockId) blockIds.push(String(node.attrs.blockId))
    })
    setSelection({ from, to, text, blockIds: [...new Set(blockIds)] })
  }, [])

  return { selection, syncFromEditor, clearSelection: () => setSelection(null) }
}
