"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatBubbleProps = {
  role: "user" | "assistant";
  content: string;
};

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="ml-auto max-w-[82%] rounded-[1.35rem] bg-white px-4 py-3 text-[15px] leading-6 text-black sb-fade-up">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  return (
    <div className="mr-auto max-w-[92%] px-1 py-2 text-[15.5px] leading-7 text-white sb-fade-up">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1.5 pl-5 last:mb-0">
              {children}
            </ol>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          code: ({ children }) => (
            <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-[13px] text-white">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
