import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}>
      {children}
    </div>
  );
}
