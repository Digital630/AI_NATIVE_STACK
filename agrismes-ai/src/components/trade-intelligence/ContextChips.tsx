const CHIP_LABELS: Record<string, string> = {
  commodity: "Commodity",
  grade: "Grade",
  origin: "Origin",
  destination: "Destination",
  incoterm: "Incoterm",
  quantity: "Quantity",
  role: "Role",
  packaging: "Packaging",
  certification: "Certification",
};

interface ContextChipsProps {
  chips: { key: string; value: string }[];
}

export function ContextChips({ chips }: ContextChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-[#E5E7EB] bg-white text-[#111111]"
        >
          <span className="text-[#6B7280] font-normal">{CHIP_LABELS[chip.key] || chip.key}:</span>
          <span className="font-medium">{chip.value}</span>
        </span>
      ))}
    </div>
  );
}
