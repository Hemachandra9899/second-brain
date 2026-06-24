export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box =
    size === "lg" ? "h-16 w-16 text-2xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";

  return (
    <div
      className={`${box} relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#07111a] font-black tracking-[-0.08em] text-white shadow-[0_0_34px_rgba(63,220,255,0.18)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(94,234,212,0.55),transparent_32%),radial-gradient(circle_at_80%_90%,rgba(124,58,237,0.45),transparent_34%)]" />
      <span className="relative">SB</span>
    </div>
  );
}
