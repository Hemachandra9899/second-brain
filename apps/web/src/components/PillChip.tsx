type PillChipProps = {
  label: string;
  active?: boolean;
};

export function PillChip({ label, active = false }: PillChipProps) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm shadow-sm transition ${
        active
          ? "bg-sky-500 text-white"
          : "border border-sky-100 bg-white/70 text-slate-600 backdrop-blur"
      }`}
    >
      {label}
    </button>
  );
}
