export function BrandLogo({
  size = "md",
  showText = false,
}: {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) {
  const box =
    size === "lg"
      ? "h-20 w-20 text-4xl rounded-[1.8rem]"
      : size === "sm"
        ? "h-10 w-10 text-lg rounded-2xl"
        : "h-12 w-12 text-xl rounded-[1.25rem]";

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className={`${box} relative flex items-center justify-center overflow-hidden bg-[#071018] font-black text-white shadow-[0_0_50px_rgba(32,214,210,0.22)] ring-1 ring-white/10`}
        aria-label="Second Brain logo"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(32,214,210,0.55),transparent_34%),radial-gradient(circle_at_75%_80%,rgba(139,123,255,0.45),transparent_36%)]" />
        <div className="absolute inset-[1px] rounded-[inherit] bg-black/30" />
        <span className="relative tracking-[-0.12em]">SB</span>
      </div>

      {showText ? (
        <div className="leading-none">
          <p className="text-base font-semibold tracking-[-0.04em] text-white">
            Second Brain
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/42">
            Personal AI OS
          </p>
        </div>
      ) : null}
    </div>
  );
}
