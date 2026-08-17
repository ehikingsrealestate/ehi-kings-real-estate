import { useQuery, useMutation } from 'convex/react';
import { Check, ShieldCheck, LockKeyhole, Pencil } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin, roleBadgeClass, ROLES, CAPS, type Role, type Cap } from './store';

export default function Permissions() {
  const { token, can } = useAdmin();
  const rows = useQuery(api.permissions.list, token ? { token } : 'skip') ?? [];
  const setCap = useMutation(api.permissions.setCap);
  const editable = can('manage_permissions');

  const capsByRole = new Map(rows.map((r) => [r.role as Role, r.caps as Record<Cap, boolean>]));
  const editableCopy = editable ? 'Live role matrix. Changes apply instantly.' : 'View-only role matrix.';

  return (
    <div className="font-sans">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">Access</h1>
          <p className="admin-page-copy">{editableCopy} Server rules still block unauthorized actions.</p>
        </div>
        <div className="admin-card flex items-center gap-3 px-4 py-3">
          <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center">
            {editable ? <Pencil className="w-4 h-4" /> : <LockKeyhole className="w-4 h-4" />}
          </span>
          <span>
            <span className="block text-sm text-white">{editable ? 'Editable' : 'Locked'}</span>
            <span className="block text-xs text-white/42">{CAPS.length} capabilities</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {ROLES.map((role) => {
          const count = CAPS.filter((cap) => Boolean(capsByRole.get(role)?.[cap.key])).length;
          return (
            <div key={role} className="admin-card p-4">
              <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="font-heading text-2xl font-light tnum text-white">{count}</div>
              <div className="text-[0.7rem] text-white/45 mt-0.5">{role} caps</div>
            </div>
          );
        })}
      </div>

      <div className="admin-table-wrap mt-6 overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="text-left p-4 text-[0.7rem] text-white/42 font-normal">Capability</th>
              {ROLES.map((r) => (
                <th key={r} className="p-4 text-center">
                  <span className={`text-[0.6rem] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full ${roleBadgeClass(r)}`}>{r}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAPS.map((cap) => (
              <tr key={cap.key} className="border-t border-white/[0.08]">
                <td className="p-4">
                  <div className="text-sm text-white">{cap.label}</div>
                  <div className="text-xs text-white/42 mt-0.5">{cap.note}</div>
                </td>
                {ROLES.map((role) => {
                  const on = Boolean(capsByRole.get(role)?.[cap.key]);
                  return (
                    <td key={role} className="p-4 text-center">
                      <button
                        disabled={!editable}
                        onClick={() => token && setCap({ token, role, cap: cap.key, value: !on })}
                        className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-colors ${
                          on ? 'bg-accent text-accent-ink' : 'border border-white/10 text-transparent hover:border-accent/50'
                        } ${editable ? 'cursor-pointer' : 'cursor-default'}`}
                        aria-label={`${on ? 'Disable' : 'Enable'} ${cap.label} for ${role}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
