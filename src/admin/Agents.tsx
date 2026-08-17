import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAction } from 'convex/react';
import { ArrowUpRight, Bot, CheckCircle2, ExternalLink, GitFork, Loader2, Play, ShieldCheck } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { COMPANY } from '../data/site';
import { useEstates } from '../data/useEstates';
import { ADMIN_AGENTS, ADMIN_APP_INTEGRATIONS, type AdminAgent } from '../data/adminAgents';
import { DEFAULT_SITE_BLOCKS } from '../data/siteBlocks';
import { useAdmin } from './store';

type AgentResult = {
  agent: string;
  text: string;
  provider?: string;
};

type ProviderStatus = {
  id: string;
  label: string;
  model: string;
  configured: boolean;
};

const integrationLabel = {
  linked: 'Linked',
  forked: 'Forked',
  needs_setup: 'Needs setup',
} as const;

export default function Agents() {
  const { token, me } = useAdmin();
  const [searchParams] = useSearchParams();
  const estates = useEstates();
  const ask = useAction(api.assistant.ask);
  const providerStatus = useAction(api.assistant.providerStatus);
  const suiteTicket = useAction(api.suite.ticket);
  const [ssoBusy, setSsoBusy] = useState('');
  const [ssoError, setSsoError] = useState<Record<string, string>>({});

  const openSigned = async (gw: string, fallbackHref: string) => {
    if (!token) return;
    setSsoBusy(gw);
    setSsoError((prev) => {
      if (!prev[gw]) return prev;
      const next = { ...prev };
      delete next[gw];
      return next;
    });
    try {
      const res = await suiteTicket({ token, app: gw });
      if (res.url) {
        window.open(res.url, '_blank', 'noopener');
      } else if (fallbackHref.startsWith('/')) {
        window.location.href = fallbackHref;
      } else {
        setSsoError((prev) => ({ ...prev, [gw]: 'Signed-in link unavailable. Try the plain Open link, or check backend SSO config.' }));
      }
    } catch (err) {
      setSsoError((prev) => ({ ...prev, [gw]: err instanceof Error ? err.message : 'Could not create a signed-in session.' }));
    } finally {
      setSsoBusy('');
    }
  };
  const [active, setActive] = useState<AdminAgent>(ADMIN_AGENTS[0]);
  const [request, setRequest] = useState('Summarise the best next action for today.');
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);

  const catalog = useMemo(
    () => estates.map((e) => ({ name: e.name, location: e.location, price: e.price, kind: e.kind, size: e.size })),
    [estates],
  );
  const land = estates.filter((e) => e.kind === 'land').length;
  const homes = estates.filter((e) => e.kind === 'home').length;
  const portfolio = `${estates.length} listings (${land} land, ${homes} homes) across Lagos, Epe, Benin City and Abuja`;

  useEffect(() => {
    if (!token) return;
    providerStatus({ token })
      .then((rows) => setProviders(rows as ProviderStatus[]))
      .catch(() => setProviders([]));
  }, [providerStatus, token]);

  useEffect(() => {
    const id = searchParams.get('agent');
    const selected = ADMIN_AGENTS.find((agent) => agent.id === id);
    if (selected) setActive(selected);
  }, [searchParams]);

  const runAgent = async (agent = active) => {
    if (!token || busy) return;
    setBusy(agent.id);
    setActive(agent);
    setResult(null);
    try {
      const res = await ask({
        token,
        history: [
          {
            role: 'user',
            text: [
              agent.prompt,
              '',
              `Staff member: ${me?.name ?? 'Signed-in user'} (${me?.role ?? 'Staff'}).`,
              `Request: ${request.trim() || 'Start with a concise status check.'}`,
            ].join('\n'),
          },
        ],
        portfolio: `${portfolio}. Company: ${COMPANY.name}. Mission: ${COMPANY.mission}. Vision: ${COMPANY.vision}. Editable site blocks: ${DEFAULT_SITE_BLOCKS.map((b) => `${b.label} (${b.area})`).join(', ')}.`,
        catalog,
      });
      if (!res.configured) {
        setResult({
          agent: agent.name,
          text: 'No AI provider is configured on the backend yet. Add Gemini, Groq, or DeepSeek keys in Convex env, then run this agent again.',
        });
      } else if (res.error) {
        setResult({ agent: agent.name, text: res.error, provider: res.provider });
      } else {
        const toolNote = res.usedTools?.length ? `\n\nRan: ${res.usedTools.join(', ')}` : '';
        setResult({ agent: agent.name, text: `${res.reply ?? ''}${toolNote}`, provider: res.provider });
      }
    } catch (err) {
      setResult({ agent: agent.name, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="admin-page-shell">
      <section className="admin-hero-panel">
        <div>
          <p className="admin-kicker">Agency agents</p>
          <h1 className="admin-hero-title">Real estate agents, wired to company work.</h1>
          <p className="admin-hero-copy">
            Forked references are tracked below. These agents run through the role-aware company copilot, so they use only the data and tools available to the signed-in staff member.
          </p>
        </div>
        <div className="admin-provider-strip" aria-label="Configured AI providers">
          {providers.length ? providers.map((provider) => (
            <span key={provider.id} className="admin-provider-chip">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {provider.label}
              <span>{provider.model}</span>
            </span>
          )) : (
            <span className="admin-provider-chip muted">
              <ShieldCheck className="h-3.5 w-3.5" />
              Provider status loads after backend keys are deployed
            </span>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="admin-agent-grid">
          {ADMIN_AGENTS.map((agent, index) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setActive(agent)}
              className={`admin-agent-tile ${active.id === agent.id ? 'is-active' : ''}`}
              style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
            >
              <span className="admin-agent-icon"><agent.icon className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="admin-agent-division">{agent.division}</span>
                <span className="admin-agent-name">{agent.name}</span>
                <span className="admin-agent-description">{agent.description}</span>
                {agent.source && <span className="admin-agent-source">{agent.source}</span>}
              </span>
            </button>
          ))}
        </div>

        <aside className="admin-agent-console">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="admin-agent-division">{active.division}</p>
              <h2 className="admin-agent-console-title">{active.name}</h2>
            </div>
            <active.icon className="h-6 w-6 text-accent-2" />
          </div>
          <p className="admin-agent-console-copy">{active.description}</p>
          {active.source && <p className="admin-agent-console-source">{active.source}</p>}
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            className="admin-agent-textarea"
            placeholder="Give this agent a real instruction..."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAgent(active)}
              disabled={Boolean(busy)}
              className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] bg-accent-2 px-4 py-2.5 text-xs font-medium text-accent-2-ink transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {busy === active.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run agent
            </button>
            {active.route && (
              <Link
                to={active.route}
                className="admin-secondary-button"
              >
                Open workspace <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {result && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mb-3 flex items-center gap-2 text-xs text-white/46">
                <Bot className="h-4 w-4 text-accent" />
                {result.agent}
                {result.provider && <span className="text-accent-2">via {result.provider}</span>}
              </div>
              <p className="admin-agent-result">{result.text}</p>
            </div>
          )}
        </aside>
      </section>

      <section className="admin-app-strip">
        <div>
          <p className="admin-kicker">Useful open apps</p>
          <h2 className="admin-section-title">Real integrations only.</h2>
          <p className="admin-section-copy">Forks are ready. Anything that still needs a server, widget token, OAuth client, or API key is clearly marked before it appears as a working tool.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {ADMIN_APP_INTEGRATIONS.map((app) => (
            <div key={app.id} className="admin-app-link">
              <span className="min-w-0">
                <span className="admin-app-name">{app.name}</span>
                <span className="admin-app-purpose">{app.purpose}</span>
                <span className="admin-app-setup">{app.setup}</span>
              </span>
              <span className="admin-app-meta">
                <span className={`admin-setup-badge is-${app.status}`}>
                  {app.status === 'forked' ? <GitFork className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {integrationLabel[app.status]}
                </span>
                {app.license && <span className="admin-license-badge">{app.license}</span>}
                <span className="flex gap-2">
                  {app.gw ? (
                    <button onClick={() => openSigned(app.gw!, app.href)} disabled={ssoBusy === app.gw} className="admin-mini-link">
                      {ssoBusy === app.gw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Open signed-in <ExternalLink className="h-3.5 w-3.5" /></>}
                    </button>
                  ) : (
                    <a
                      href={app.href}
                      target={app.href.startsWith('/') ? undefined : '_blank'}
                      rel={app.href.startsWith('/') ? undefined : 'noreferrer'}
                      className="admin-mini-link"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {app.sourceHref && (
                    <a href={app.sourceHref} target="_blank" rel="noreferrer" className="admin-mini-link">
                      Source
                    </a>
                  )}
                </span>
                {app.gw && ssoError[app.gw] && (
                  <span className="admin-app-sso-error text-[11px] text-red-300" role="alert">
                    {ssoError[app.gw]}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
