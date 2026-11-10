interface StatCardProps {
  label: string;
  value: string;
  note: string;
  tone?: 'positive' | 'negative' | 'muted';
}

export function StatCard({ label, value, note, tone = 'muted' }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className={`stat-note stat-note--${tone}`}>{note}</p>
    </div>
  );
}
