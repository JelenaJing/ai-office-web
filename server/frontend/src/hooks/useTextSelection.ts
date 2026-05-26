/**
 * 文本选择Hook
 */
import { useState, useCallback, useEffect } from 'react';

export interface TextSelection {
  text: string;
  start: number;
  end: number;
}

export function useTextSelection() {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const handleSelection = useCallback((text: string, start: number, end: number) => {
    setSelection({ text, start, end });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selection,
    handleSelection,
    clearSelection,
  };
}
