import { useRef, useState, type FormEvent } from 'react';
import { useMutation } from 'convex/react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Mail, MapPin, Phone, Send } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { COMPANY, NAV } from '../data/site';
import { useSiteBlocks } from '../data/useSiteBlocks';
import { confettiBurst } from './fx/confetti';

export default function Footer() {
  const site = useSiteBlocks();
  const submitLead = useMutation(api.crm.submitLead);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setNote('');
    try {
      await submitLead({
        name: email.trim().split('@')[0],
        email,
        bookingType: 'newsletter',
        service: 'Newsletter',
        source: 'website footer',
        consentMarketing: true,
      });
      setEmail('');
      setNote('Subscribed.');
      const rect = sendButtonRef.current?.getBoundingClientRect();
      if (rect) confettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not subscribe.');
    }
  };

  return (
    <footer className="bg-bg px-4 pb-8 pt-4 text-primary sm:px-6 md:px-10 lg:px-14">
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-[1520px] rounded-[1.5rem] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.05)] sm:p-8 md:p-12"
      >
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1fr]">
          <div className="flex flex-col">
            <Link to="/" className="inline-flex self-start" aria-label={`${COMPANY.short} home`}>
              <img src="/brand/ehi-kings-logo-color.png" alt={COMPANY.name} className="h-14 w-auto object-contain" />
            </Link>
            <p className="mt-8 max-w-xs text-2xl leading-tight">
              {site.get('footer.cta.title', COMPANY.philosophy).split('\n').map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
            <div className="mt-auto pt-12 text-sm text-muted">
              Copyright {new Date().getFullYear()} © {COMPANY.short}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted">
              <Link to="/contact" className="inline-flex min-h-10 items-center transition-colors hover:text-accent">Terms of service</Link>
              <Link to="/contact" className="inline-flex min-h-10 items-center transition-colors hover:text-accent">Privacy policy</Link>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-heading">Quick navigation</h2>
            <ul className="mt-6 space-y-4 text-sm text-muted">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="inline-flex min-h-10 items-center transition-colors hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-heading">Properties</h2>
            <ul className="mt-6 space-y-4 text-sm text-muted">
              <li>
                <Link to="/properties" className="inline-flex min-h-10 items-center transition-colors hover:text-accent">
                  All properties
                </Link>
              </li>
              <li>
                <Link to="/properties?kind=land" className="inline-flex min-h-10 items-center transition-colors hover:text-accent">
                  Land listings
                </Link>
              </li>
              <li>
                <Link to="/properties?kind=home" className="inline-flex min-h-10 items-center transition-colors hover:text-accent">
                  Homes and developments
                </Link>
              </li>
              <li>
                <Link to="/contact" className="inline-flex min-h-10 items-center transition-colors hover:text-accent">
                  Site inspection
                </Link>
              </li>
              <li>
                <Link to="/blog" className="inline-flex min-h-10 items-center transition-colors hover:text-accent">
                  Buyer guides
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <Link
              to="/contact"
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-medium text-white transition-colors hover:bg-accent active:scale-[0.98]"
            >
              {site.get('footer.cta.button', 'Contact')}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 transition-transform group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <div className="mt-8 space-y-4 text-sm text-muted">
              <p className="flex gap-3 leading-6">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-muted" />
                {COMPANY.address}
              </p>
              <p className="flex items-center gap-3 tabular-nums">
                <Phone className="h-4 w-4 shrink-0 text-muted" />
                {COMPANY.phones[0]}
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted" />
                {COMPANY.email}
              </p>
            </div>

            <form className="mt-8" onSubmit={subscribe}>
              <label htmlFor="footer-email" className="text-lg font-heading">Subscribe to our news</label>
              <div className="mt-4 flex items-center gap-3 border-b border-rule pb-3">
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="min-w-0 flex-1 bg-transparent text-base text-primary outline-none placeholder:text-muted"
                />
                <button
                  ref={sendButtonRef}
                  type="submit"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-accent"
                  aria-label="Subscribe"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {note && <p className="mt-3 text-sm text-muted">{note}</p>}
            </form>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
