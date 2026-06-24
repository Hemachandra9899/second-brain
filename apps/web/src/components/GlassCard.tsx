import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`sb-panel rounded-[2rem] p-5 ${className}`}>
      {children}
    </div>
  );
}
