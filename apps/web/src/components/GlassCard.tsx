import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl shadow-sky-200/40 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
