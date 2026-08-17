export type Role = 'Admin' | 'Manager' | 'Agent' | 'Worker';

export const RANK: Record<Role, number> = { Admin: 0, Manager: 1, Agent: 2, Worker: 3 };

export type Cap =
  | 'assign_tasks'
  | 'manage_employees'
  | 'manage_permissions'
  | 'create_channels'
  | 'view_reports'
  | 'view_all_tasks';

export const CAPS: { key: Cap; label: string; note: string }[] = [
  { key: 'view_all_tasks', label: 'See all tasks', note: 'View every task, not just their own' },
  { key: 'assign_tasks', label: 'Assign tasks', note: 'Create and assign work to staff' },
  { key: 'manage_employees', label: 'Manage employees', note: 'Add staff and change roles' },
  { key: 'manage_permissions', label: 'Manage permissions', note: 'Edit this permission matrix' },
  { key: 'create_channels', label: 'Create chat groups', note: 'Start new project channels' },
  { key: 'view_reports', label: 'View reports', note: 'See business overview metrics' },
];

export const ROLES: Role[] = ['Admin', 'Manager', 'Agent', 'Worker'];

export function roleBadgeClass(role: Role): string {
  switch (role) {
    case 'Admin': return 'bg-accent text-accent-ink';
    case 'Manager': return 'bg-accent-2 text-accent-2-ink';
    case 'Agent': return 'border border-accent text-accent';
    default: return 'border border-rule text-muted';
  }
}
