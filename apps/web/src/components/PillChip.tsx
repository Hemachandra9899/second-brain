type PillChipProps = {
  label: string;
  active?: boolean;
};

export function PillChip({ label, active = false }: PillChipProps) {
  return (
    <button
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-white/7 text-white/62 backdrop-blur"
      }`}
    >
      {label}
    </button>
  );
}
