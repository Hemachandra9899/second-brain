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
      <div className="ml-auto max-w-[84%] rounded-[1.35rem] bg-white px-4 py-3 text-[15px] font-medium leading-6 text-black sb-fade-up">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  return (
    <div className="mr-auto max-w-[94%] rounded-[1.35rem] border border-white/8 bg-white/6 px-4 py-3 text-[15.5px] leading-7 text-white sb-fade-up">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          code: ({ children }) => <code className="rounded-md bg-black/45 px-1.5 py-0.5 text-[13px] text-cyan-100">{children}</code>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
