import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ClipboardList,
  Handshake,
  MessagesSquare,
  SearchCheck,
} from 'lucide-react';

export type AdminAgent = {
  id: string;
  name: string;
  division: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
  route?: string;
  source?: string;
};

export type AdminAppIntegration = {
  id: string;
  name: string;
  purpose: string;
  href: string;
  sourceHref?: string;
  license?: string;
  setup: string;
  status: 'forked' | 'linked' | 'needs_setup';
  // When set, "Open" mints an SSO ticket (suite.ticket) and opens the running
  // engine already signed in, instead of navigating to href.
  gw?: string;
};

export const ADMIN_AGENTS: AdminAgent[] = [
  {
    id: 'lead-intake',
    name: 'Lead intake agent',
    division: 'Sales',
    description: 'Turns buyer messages into clean lead notes, required follow-ups, and task suggestions.',
    prompt: 'Act as the Ehi-Kings Lead Intake Agent. Capture buyer intent, budget, location, urgency, source, and next action. If a task is needed, use the task tool.',
    icon: Handshake,
    route: '/admin/tasks',
    source: 'Adapted from agency-agents sales and support patterns.',
  },
  {
    id: 'buyer-match',
    name: 'Buyer match agent',
    division: 'Portfolio',
    description: 'Matches a client brief to land, homes, and developments in the live portfolio.',
    prompt: 'Act as the Ehi-Kings Buyer Match Agent. Ask only for missing buying criteria, then recommend matching listings from the portfolio with reasons and next inspection steps.',
    icon: SearchCheck,
    route: '/admin/listings',
    source: 'Custom real-estate portfolio agent.',
  },
  {
    id: 'listing-manager',
    name: 'Listing manager agent',
    division: 'Admin',
    description: 'Helps admins draft listing copy, feature lists, and image requirements before publishing.',
    prompt: 'Act as the Ehi-Kings Listing Manager Agent. Improve listing copy using only true details provided or existing portfolio data. Do not invent prices, title status, or amenities.',
    icon: Building2,
    route: '/admin/listings',
    source: 'Custom listing operations agent.',
  },
  {
    id: 'follow-up',
    name: 'Follow-up agent',
    division: 'Sales',
    description: 'Drafts Zoho follow-ups and creates next-step tasks from recent conversations.',
    prompt: 'Act as the Ehi-Kings Follow-up Agent. Summarize the signed-in user’s recent Zoho messages if available, draft practical follow-ups, and create tasks when asked.',
    icon: MessagesSquare,
    route: '/admin/mail',
    source: 'Adapted from agency-agents support responder and sales account strategy.',
  },
  {
    id: 'pipeline',
    name: 'Pipeline agent',
    division: 'Management',
    description: 'Reviews open work, blockers, and deal movement for managers and directors.',
    prompt: 'Act as the Ehi-Kings Pipeline Agent. Review visible tasks, current portfolio context, blockers, overdue items, and recommended next management actions.',
    icon: ClipboardList,
    route: '/admin/tasks',
    source: 'Adapted from agency-agents sales pipeline analyst.',
  },
];

export const ADMIN_APP_INTEGRATIONS: AdminAppIntegration[] = [
  {
    id: 'open-design',
    name: 'Open Design',
    purpose: 'Forked reference for design workflows, site-editor ideas, and design-system patterns.',
    href: 'https://github.com/nigelose10/open-design',
    sourceHref: 'https://github.com/nexu-io/open-design',
    license: 'Apache-2.0',
    setup: 'Reference only for now; not a drop-in runtime for this Vite admin.',
    status: 'forked',
  },
  {
    id: 'agency-agents',
    name: 'Agency Agents',
    purpose: 'Forked source for specialist agent roles adapted into the admin agent console.',
    href: 'https://github.com/nigelose10/agency-agents',
    sourceHref: 'https://github.com/msitarzewski/agency-agents',
    license: 'MIT',
    setup: 'Prompts adapted into Convex-backed agents; no external service needed.',
    status: 'linked',
  },
  {
    id: 'twenty',
    name: 'Twenty CRM',
    purpose: 'Native sales pipeline — companies, deals, kanban stages, all inside the CRM tab.',
    href: '/admin/crm',
    sourceHref: 'https://github.com/twentyhq/twenty',
    license: 'AGPL-3.0',
    setup: 'Rebuilt natively in this admin. Opens the CRM pipeline.',
    status: 'linked',
  },
  {
    id: 'customermates',
    name: 'Customermates',
    purpose: 'Open-source customer support/CRM candidate for account history and client operations.',
    href: 'https://github.com/customermates/customermates',
    sourceHref: 'https://github.com/customermates/customermates',
    setup: 'Evaluate schema and deployment fit before importing into the admin panel.',
    status: 'needs_setup',
  },
  {
    id: 'chatwoot',
    name: 'Chatwoot',
    purpose: 'Native customer inbox and website live chat — inside Team Chat.',
    href: '/admin/team-chat',
    sourceHref: 'https://github.com/chatwoot/chatwoot',
    license: 'MIT',
    setup: 'Rebuilt natively in this admin. Opens the Customers inbox.',
    status: 'linked',
  },
  {
    id: 'listmonk',
    name: 'listmonk',
    purpose: 'Native newsletters and campaigns synced with the CRM.',
    href: '/admin/marketing',
    sourceHref: 'https://github.com/knadh/listmonk',
    license: 'AGPL-3.0',
    setup: 'Rebuilt natively in this admin. Opens the Marketing tab.',
    status: 'linked',
  },
  {
    id: 'postiz',
    name: 'Postiz',
    purpose: 'Native social planner — schedule and track posts across every channel.',
    href: '/admin/social',
    sourceHref: 'https://github.com/gitroomhq/postiz-app',
    license: 'AGPL-3.0',
    setup: 'Rebuilt natively in this admin. Opens the Social planner.',
    status: 'linked',
  },
  {
    id: 'cal-diy',
    name: 'Cal.diy',
    purpose: 'Forked lightweight booking app candidate for site inspections.',
    href: 'https://github.com/nigelose10/cal.diy',
    sourceHref: 'https://github.com/calcom/cal.diy',
    license: 'MIT',
    setup: 'Needs booking URL per staff member/property before buttons go live.',
    status: 'forked',
  },
  {
    id: 'erpnext',
    name: 'ERPNext',
    purpose: 'Forked ERP candidate for finance, operations, and construction workflows.',
    href: 'https://github.com/nigelose10/erpnext',
    sourceHref: 'https://github.com/frappe/erpnext',
    license: 'GPL-3.0',
    setup: 'Needs a separate Frappe deployment and API strategy before admin embedding.',
    status: 'forked',
  },
  {
    id: 'plausible',
    name: 'Plausible',
    purpose: 'Forked privacy-friendly analytics candidate for public website traffic.',
    href: 'https://github.com/nigelose10/analytics',
    sourceHref: 'https://github.com/plausible/analytics',
    license: 'AGPL-3.0',
    setup: 'Needs deployed analytics instance and site domain config.',
    status: 'forked',
  },
  {
    id: 'posthog',
    name: 'PostHog',
    purpose: 'Forked product analytics and conversion tracking candidate.',
    href: 'https://github.com/nigelose10/posthog',
    sourceHref: 'https://github.com/PostHog/posthog',
    license: 'MIT/other',
    setup: 'Needs project key and event plan before enabling tracking.',
    status: 'forked',
  },
  {
    id: 'baserow',
    name: 'Baserow',
    purpose: 'Forked database interface candidate for internal trackers.',
    href: 'https://github.com/nigelose10/baserow',
    sourceHref: 'https://github.com/baserow/baserow',
    license: 'MIT',
    setup: 'Needs hosted instance and table schema before replacing Convex admin views.',
    status: 'forked',
  },
  {
    id: 'n8n',
    name: 'Automation Studio (n8n)',
    purpose: 'Visual workflows for leads, Zoho, CRM sync, social auto-posting, and task routing.',
    href: '/admin/apps',
    gw: 'automations',
    sourceHref: 'https://github.com/n8n-io/n8n',
    license: 'Sustainable Use License',
    setup: 'Running on the company server — opens signed in, no separate login.',
    status: 'linked',
  },
  {
    id: 'convex',
    name: 'Convex admin data',
    purpose: 'Current live backend for auth, roles, listings, tasks, chat, and site blocks.',
    href: '/admin',
    setup: 'Already used by this app. Keep production work here until external apps are configured.',
    status: 'linked',
  },
  {
    id: 'zoho',
    name: 'Zoho Mail',
    purpose: 'Existing mail OAuth/action surface for staff-visible mail summaries and follow-ups.',
    href: '/admin/mail',
    setup: 'Uses existing Zoho scaffolding; production depends on valid OAuth and role access.',
    status: 'needs_setup',
  },
  {
    id: 'maps',
    name: 'Maps workspace',
    purpose: 'Location research for estates, inspections, and area notes.',
    href: '/admin/agents?agent=gis-location',
    setup: 'Needs MapLibre/Google Maps provider decision before map embeds are enabled.',
    status: 'needs_setup',
  },
];
