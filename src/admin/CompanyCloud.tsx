import { ExternalLink, Cloud, FileText, Images, KeyRound, Mail } from 'lucide-react';
import { useAdmin } from './store';
import BlurText from '../components/reactbits/BlurText';

// Company Cloud — the staff launcher for the self-hosted suite running on the
// company VPS (OpenCloud files, Docmost docs, Ente photos). Visible to every
// staff member, workers included. Each tile opens the app in a new tab; the
// login hint tells the worker how to get in (Zoho SSO / company email).

const env = import.meta.env as Record<string, string | undefined>;

type CloudApp = {
  key: string;
  name: string;
  purpose: string;
  url: string;
  icon: typeof Cloud;
  login: string;
  loginIcon: typeof KeyRound;
};

const APPS: CloudApp[] = [
  {
    key: 'files',
    name: 'Company Drive',
    purpose: 'Store, sync and securely share company files. Password-protected links with expiry and download limits — better than Dropbox or Google Drive.',
    url: env.VITE_APP_CLOUD_URL || 'https://cloud.207-180-245-46.sslip.io',
    icon: Cloud,
    login: 'Sign in with your Zoho / company email',
    loginIcon: KeyRound,
  },
  {
    key: 'docs',
    name: 'Company Docs',
    purpose: 'The shared team wiki and knowledge base — SOPs, playbooks, onboarding, meeting notes. Real-time collaborative editing.',
    url: env.VITE_APP_DOCS_URL || 'https://docs.207-180-245-46.sslip.io',
    icon: FileText,
    login: 'Sign in with your company email (invite from an admin)',
    loginIcon: Mail,
  },
  {
    key: 'photos',
    name: 'Company Photos',
    purpose: 'End-to-end encrypted photo & media library for property shoots and site visits. Private by design — only the company can see it.',
    url: env.VITE_APP_PHOTOS_URL || 'https://photos.207-180-245-46.sslip.io',
    icon: Images,
    login: 'Sign up with your company email + a one-time code',
    loginIcon: Mail,
  },
];

export default function CompanyCloud() {
  const { me } = useAdmin();

  return (
    <div className="admin-page-shell">
      <div className="admin-section-head">
        <div>
          <p className="admin-kicker">Ehi-Kings Cloud</p>
          <BlurText as="h1" text="Your company cloud." animateBy="words" delay={90} className="admin-page-title font-heading" />
          <p className="admin-page-copy">
            Files, docs and photos — self-hosted on the company server, not a third party. Open any app below;
            sign in with your company identity.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {APPS.map((app) => (
          <a
            key={app.key}
            href={app.url}
            target="_blank"
            rel="noreferrer noopener"
            className="admin-card group flex flex-col gap-4 p-5 transition-transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="admin-workspace-orb !mb-0 h-12 w-12">
                <app.icon className="h-5 w-5" />
              </span>
              <ExternalLink className="h-4 w-4 text-white/30 transition-colors group-hover:text-accent-2" />
            </div>
            <div>
              <div className="admin-app-name text-lg">{app.name}</div>
              <p className="admin-app-purpose mt-2 !text-[0.85rem] leading-6">{app.purpose}</p>
            </div>
            <div className="mt-auto flex items-center gap-2 border-t border-white/8 pt-3 text-xs text-accent-2">
              <app.loginIcon className="h-3.5 w-3.5 shrink-0" />
              {app.login}
            </div>
          </a>
        ))}
      </div>

      {me?.role === 'Admin' && (
        <div className="admin-panel mt-6 p-5">
          <p className="admin-kicker">Admin setup</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/70">
            <li className="flex gap-2">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
              <span><strong className="text-white/90">Company Drive (OpenCloud):</strong> once “Login with Zoho” is enabled, staff sign in with their Zoho email and an account is created automatically. Until then, share the admin login.</span>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
              <span><strong className="text-white/90">Company Docs (Docmost):</strong> invite each worker by their company email from the Docmost members settings.</span>
            </li>
            <li className="flex gap-2">
              <Images className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
              <span><strong className="text-white/90">Company Photos (Ente):</strong> workers self-sign-up with their company email; it’s end-to-end encrypted, so each person holds their own key.</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
