export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box =
    size === "lg" ? "h-16 w-16 text-3xl" : size === "sm" ? "h-9 w-9 text-base" : "h-11 w-11 text-xl";

  return (
    <div
      className={`${box} flex items-center justify-center rounded-2xl bg-white font-black tracking-[-0.08em] text-black shadow-[0_0_40px_rgba(255,255,255,0.12)]`}
    >
      B
    </div>
  );
}
