import { useEffect, useRef, useState } from 'react';
import { Plus, ChevronDown, type LucideIcon } from 'lucide-react';

// Reusable "Add …" control — a button that opens a small picker list, so a page
// shows only what's active and offers more on demand (progressive disclosure)
// instead of laying every option out. Used app-wide (Social connectors, CRM
// records, etc.) for a consistent, uncluttered feel.

export type AddMenuOption = {
  key: string;
  label: string;
  icon?: LucideIcon;
  hint?: string;
  disabled?: boolean;
};

export default function AddMenu({
  label = 'Add',
  options,
  onPick,
  align = 'right',
  variant = 'primary',
  emptyText = 'Nothing left to add.',
}: {
  label?: string;
  options: AddMenuOption[];
  onPick: (key: string) => void;
  align?: 'left' | 'right';
  variant?: 'primary' | 'secondary';
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${variant === 'primary' ? 'admin-primary-button' : 'admin-secondary-button'} inline-flex items-center gap-1.5`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Plus className="h-4 w-4" /> {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--admin-radius-card)] border border-rule bg-surface p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-white/40">{emptyText}</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                role="menuitem"
                disabled={opt.disabled}
                onClick={() => { setOpen(false); onPick(opt.key); }}
                className="flex w-full items-center gap-2.5 rounded-[var(--admin-radius-control)] px-3 py-2 text-left transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {opt.icon && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <opt.icon className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white/85">{opt.label}</span>
                  {opt.hint && <span className="block truncate text-[0.68rem] text-white/40">{opt.hint}</span>}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
