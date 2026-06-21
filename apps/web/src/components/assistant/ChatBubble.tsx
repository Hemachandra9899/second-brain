"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatBubbleProps = {
  role: "user" | "assistant";
  content: string;
};

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={
        isUser
          ? "ml-auto max-w-[82%] rounded-[1.35rem] rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white shadow-sm"
          : "mr-auto max-w-[88%] rounded-[1.35rem] rounded-bl-md bg-white/95 px-4 py-3 text-sm leading-6 text-zinc-700 shadow-sm"
      }
    >
      {isUser ? (
        <p className="whitespace-pre-wrap">{content}</p>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="mb-3 last:mb-0">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                {children}
              </ol>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-zinc-950">{children}</strong>
            ),
            code: ({ children }) => (
              <code className="rounded-md bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800">
                {children}
              </code>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
}
