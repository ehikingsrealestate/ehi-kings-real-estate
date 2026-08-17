import { useEffect, useState } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// "Add to home screen" button for the staff PWA.
// - Android / desktop Chrome: fires the native install prompt.
// - iOS Safari (no prompt API): shows the manual Share → Add to Home Screen steps.
export default function InstallButton({ collapsed }: { collapsed?: boolean }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => setHidden(true);
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (hidden || standalone) return null;

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice.catch(() => null);
      if (choice?.outcome === 'accepted') setHidden(true);
      setDeferred(null);
    } else {
      setShowIOS(true);
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2 w-full justify-center'} rounded-xl border border-accent/40 bg-accent/10 text-accent px-3 py-2.5 text-xs font-medium hover:bg-accent/20 transition-colors`}
        title="Add to home screen"
      >
        <Download className="w-4 h-4 shrink-0" /> {!collapsed && 'Install app'}
      </button>

      {showIOS && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setShowIOS(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-bg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Add to Home Screen</h3>
              <button onClick={() => setShowIOS(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <ol className="space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-3">Tap the <Share className="w-4 h-4 text-accent inline" /> <span className="text-white">Share</span> button in your browser bar.</li>
              <li className="flex items-center gap-3">Choose <Plus className="w-4 h-4 text-accent inline" /> <span className="text-white">Add to Home Screen</span>.</li>
              <li>Open <span className="text-white">EK Staff</span> from your home screen — it runs full-screen like an app.</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
