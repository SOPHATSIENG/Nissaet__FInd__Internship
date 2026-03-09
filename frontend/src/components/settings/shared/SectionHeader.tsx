interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({title, description}: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}
