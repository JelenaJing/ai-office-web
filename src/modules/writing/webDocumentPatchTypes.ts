export type WebDocumentPatch =
  | { type: 'replace_selection'; html: string; markdown?: string }
  | { type: 'insert_at_cursor'; html: string; markdown?: string }
  | { type: 'replace_document'; html: string; markdown?: string }
  | { type: 'append_section'; title?: string; html: string; markdown?: string }

export type DocumentEditMode =
  | 'rewrite_selection'
  | 'insert_at_cursor'
  | 'replace_document'
  | 'polish_document'
