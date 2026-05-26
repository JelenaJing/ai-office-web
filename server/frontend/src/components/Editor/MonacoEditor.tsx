/**
 * Monaco编辑器组件
 */
import { useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

// 配置Monaco Editor使用CDN（更可靠）
if (typeof window !== 'undefined') {
  // 使用jsDelivr CDN作为worker源，确保可以正常加载
  loader.config({ 
    paths: { 
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' 
    } 
  });
}

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onSelectionChange?: (text: string, start: number, end: number) => void;
  language?: string;
  readOnly?: boolean;
}

export default function MonacoEditor({
  value,
  onChange,
  onSelectionChange,
  language = 'markdown',
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // 监听选择变化
    editor.onDidChangeCursorSelection((e) => {
      if (onSelectionChange && !e.selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(e.selection) || '';
        const start = editor.getModel()?.getOffsetAt(e.selection.getStartPosition()) || 0;
        const end = editor.getModel()?.getOffsetAt(e.selection.getEndPosition()) || 0;
        onSelectionChange(selectedText, start, end);
      }
    });
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={(val) => onChange?.(val || '')}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        minimap: { enabled: true },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
      }}
      theme="vs-dark"
    />
  );
}
