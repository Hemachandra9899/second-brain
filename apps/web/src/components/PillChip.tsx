type PillChipProps = {
  label: string;
  active?: boolean;
};

export function PillChip({ label, active = false }: PillChipProps) {
  return (
    <button
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition active:scale-95 ${
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-white/10 text-white/60 backdrop-blur hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
