import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  chip?: string;
  children: ReactNode;
}

export function Panel({ title, chip, children }: PanelProps) {
  return (
    <section className="panel">
      {(title || chip) && (
        <div className="panel-header">
          {title && <h2 className="panel-title">{title}</h2>}
          {chip && <span className="chip">{chip}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
