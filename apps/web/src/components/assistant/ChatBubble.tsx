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
      <div className="ml-auto max-w-[82%] rounded-[1.35rem] bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-black shadow-xl shadow-black/20 sb-fade-up">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  return (
    <div className="mr-auto max-w-[92%] rounded-[1.35rem] border border-white/10 bg-white/[0.07] px-4 py-3 text-[14px] leading-6 text-white/88 shadow-xl shadow-black/20 sb-fade-up">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          strong: ({ children }) => <strong className="font-black text-white">{children}</strong>,
          code: ({ children }) => <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-[12px] text-cyan-100">{children}</code>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
