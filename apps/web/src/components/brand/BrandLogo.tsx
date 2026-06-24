export function BrandLogo({ size = "md", wordmark = false }: { size?: "sm" | "md" | "lg"; wordmark?: boolean }) {
  const box =
    size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} relative flex items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/15 bg-[#061014] font-black tracking-[-0.08em] text-white shadow-[0_0_42px_rgba(142,232,240,0.22)]`}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(142,232,240,0.58),transparent_34%),radial-gradient(circle_at_80%_82%,rgba(105,167,255,0.48),transparent_34%)]" />
        <span className="relative">SB</span>
      </div>

      {wordmark ? (
        <div className="leading-none">
          <p className="text-base font-bold tracking-[-0.04em] text-white">Second Brain</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-100/70">Personal AI OS</p>
        </div>
      ) : null}
    </div>
  );
}
