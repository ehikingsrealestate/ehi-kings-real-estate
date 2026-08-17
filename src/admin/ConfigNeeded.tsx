import { Link } from 'react-router-dom';

export default function ConfigNeeded() {
  return (
    <div className="min-h-screen bg-bg text-primary font-sans flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="inline-flex mb-8">
          <img src="/brand/ehi-kings-logo-color.png" alt="Ehi-Kings" className="h-11 w-auto" />
        </div>
        <h1 className="font-heading text-3xl font-light tracking-tight">Workspace not configured</h1>
        <p className="text-muted mt-4 leading-relaxed">
          The staff workspace needs its Convex backend. Set <code className="text-accent">VITE_CONVEX_URL</code> in
          the environment and redeploy.
        </p>
        <Link to="/" className="inline-block mt-8 text-xs tracking-[0.18em] uppercase text-muted hover:text-accent transition-colors">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
