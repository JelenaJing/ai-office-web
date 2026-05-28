import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

interface AssistantMarkdownProps {
  content: string;
  className?: string;
}

/** 助手回复 Markdown 渲染 */
export function AssistantMarkdown({ content, className }: AssistantMarkdownProps) {
  return (
    <div className={clsx("assistant-markdown text-sm leading-relaxed", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
