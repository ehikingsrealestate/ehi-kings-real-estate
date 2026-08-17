export const DEFAULT_PERMISSIONS = {
  Admin: {
    assign_tasks: true,
    manage_employees: true,
    manage_permissions: true,
    create_channels: true,
    view_reports: true,
    view_all_tasks: true,
  },
  Manager: {
    assign_tasks: true,
    manage_employees: true,
    manage_permissions: false,
    create_channels: true,
    view_reports: true,
    view_all_tasks: true,
  },
  Agent: {
    assign_tasks: false,
    manage_employees: false,
    manage_permissions: false,
    create_channels: true,
    view_reports: false,
    view_all_tasks: false,
  },
  Worker: {
    assign_tasks: false,
    manage_employees: false,
    manage_permissions: false,
    create_channels: false,
    view_reports: false,
    view_all_tasks: false,
  },
} as const;

export const ROLES = ["Admin", "Manager", "Agent", "Worker"] as const;
