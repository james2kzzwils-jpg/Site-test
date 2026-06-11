'use client';

import { useRef, useState, useEffect, type FormEvent } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

type SubmitState = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

// Local-storage key used to remember "this browser already sent one in
// the last 24h" so we can disable the button client-side. The server
// has its own per-IP rate-limit (3/24h) — this client check is just a
// UX nicety so we don't even attempt the request.
const LS_LAST_SENT_KEY = 'epov:contact:last_sent_at';
const CLIENT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default function Contact() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  // Initialise project_type to the first localised label so the
  // controlled <select> never desyncs from its visual default. The
  // initialiser runs once per locale switch via the language dict
  // identity — see fallback in onSubmit too.
  const firstProjectType = Object.values(t.contact.form.project_types)[0] ?? '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState(firstProjectType);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<SubmitState>('idle');

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown(true);
      },
      { threshold: 0.04 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // On mount, if we already sent within the cooldown window, lock the
  // form into the `sent` state. SSR renders 'idle' for deterministic
  // markup; the post-mount setState below is the intentional flip to
  // the persisted browser state.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_LAST_SENT_KEY);
      if (!raw) return;
      const t0 = Number(raw);
      if (!Number.isFinite(t0)) return;
      if (Date.now() - t0 < CLIENT_COOLDOWN_MS) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState('sent');
      }
    } catch {
      /* localStorage unavailable — fall through */
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (state === 'sending' || state === 'sent') return;

    if (!name.trim() || !email.trim() || !message.trim()) {
      setState('error');
      return;
    }

    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          project_type: projectType || null,
          message: message.trim(),
        }),
      });
      if (res.status === 429) {
        setState('rate_limited');
        return;
      }
      if (!res.ok) {
        setState('error');
        return;
      }
      try {
        window.localStorage.setItem(LS_LAST_SENT_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      setState('sent');
    } catch {
      setState('error');
    }
  }

  // Button label echoes the current state — the original requirement
  // was "after pressing Send, the button should show 'Sent'", which we
  // extend to also show in-flight + error states.
  const sendLabel = (() => {
    switch (state) {
      case 'sending':
        return t.contact.form.sending;
      case 'sent':
        return t.contact.form.sent;
      case 'error':
        return t.contact.form.error;
      case 'rate_limited':
        return t.contact.form.rate_limited;
      default:
        return t.contact.form.send;
    }
  })();

  const locked = state === 'sending' || state === 'sent';
  const showAccent = state === 'sent';

  return (
    <section id="contact" ref={sectionRef} className="py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-14">
        <div className={shown ? 'reveal is-in' : 'reveal'}>
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
            <span className="accent-diamond">◆</span> {t.contact.section_label}
          </p>
          <h2 className="max-w-[1100px] font-display text-[clamp(2.6rem,8vw,7rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
            {t.contact.title}
          </h2>
          <p className="mt-8 max-w-lg text-[16px] leading-[1.7] text-[var(--foreground)]/55">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="mt-24 grid gap-16 border-t border-[var(--hairline)] pt-16 lg:grid-cols-[1fr_1.4fr] lg:gap-28">
          <div
            className={`flex flex-col gap-10 ${
              shown ? 'reveal is-in' : 'reveal'
            }`}
            style={{ transitionDelay: '180ms' }}
          >
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                Email
              </p>
              <a
                href={`mailto:${t.contact.info.email}`}
                className="hover-line inline-block pb-1 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)]"
                data-cursor="hover"
              >
                {t.contact.info.email}
              </a>
            </div>
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                Telegram
              </p>
              <a
                href={`https://t.me/${t.contact.info.telegram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover-line inline-block pb-1 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)]"
                data-cursor="hover"
              >
                {t.contact.info.telegram}
              </a>
            </div>
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                Location
              </p>
              <p className="font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)]/70">
                {t.contact.info.location}
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-[var(--hairline)] pt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
              <span
                aria-hidden="true"
                className="h-[6px] w-[6px] animate-pulse rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]"
              />
              {t.footer.available}
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className={`flex flex-col gap-10 ${
              shown ? 'reveal is-in' : 'reveal'
            }`}
            style={{ transitionDelay: '260ms' }}
          >
            <div>
              <label
                htmlFor="contactName"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40"
              >
                {t.contact.form.name}
              </label>
              <input
                id="contactName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={locked}
                className="w-full border-b border-[var(--hairline)] bg-transparent pb-3 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)] outline-none transition-colors duration-300 placeholder:text-[var(--foreground)]/15 focus:border-[var(--foreground)]/60 disabled:opacity-50"
                placeholder={t.contact.form.name}
              />
            </div>

            <div>
              <label
                htmlFor="contactEmail"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40"
              >
                {t.contact.form.email}
              </label>
              <input
                id="contactEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={locked}
                className="w-full border-b border-[var(--hairline)] bg-transparent pb-3 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)] outline-none transition-colors duration-300 placeholder:text-[var(--foreground)]/15 focus:border-[var(--foreground)]/60 disabled:opacity-50"
                placeholder={t.contact.form.email}
              />
            </div>

            <div>
              <label
                htmlFor="contactProjectType"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40"
              >
                {t.contact.form.project_type}
              </label>
              <select
                id="contactProjectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                disabled={locked}
                className="w-full appearance-none border-b border-[var(--hairline)] bg-transparent pb-3 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)]/80 outline-none transition-colors duration-300 focus:border-[var(--foreground)]/60 disabled:opacity-50"
              >
                {Object.values(t.contact.form.project_types).map((type) => (
                  <option key={type} className="bg-[#050505] text-[var(--foreground)]">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="contactMessage"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40"
              >
                {t.contact.form.message}
              </label>
              <textarea
                id="contactMessage"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={locked}
                className="w-full resize-none border-b border-[var(--hairline)] bg-transparent pb-3 font-display text-[18px] tracking-[-0.01em] text-[var(--foreground)] outline-none transition-colors duration-300 placeholder:text-[var(--foreground)]/15 focus:border-[var(--foreground)]/60 disabled:opacity-50"
                placeholder={t.contact.form.message}
              />
            </div>

            <button
              type="submit"
              disabled={locked}
              aria-busy={state === 'sending'}
              className={`group inline-flex items-center justify-between border-t border-[var(--hairline)] pt-8 text-left transition-colors duration-300 hover:border-[var(--foreground)]/50 disabled:cursor-default ${
                showAccent ? 'border-[var(--accent)]/60' : ''
              }`}
              data-cursor="hover"
            >
              <span
                className={`font-display text-[clamp(1.6rem,3vw,2.4rem)] font-medium tracking-[-0.02em] transition-[transform,color] duration-500 group-hover:translate-x-2 ${
                  showAccent
                    ? 'text-[var(--accent)]'
                    : state === 'error' || state === 'rate_limited'
                      ? 'text-[var(--foreground)]/55'
                      : 'text-[var(--foreground)]'
                }`}
              >
                {sendLabel}
              </span>
              <span
                aria-hidden="true"
                className={`font-mono text-[clamp(1.4rem,2.6vw,2rem)] transition-[transform,color] duration-500 group-hover:translate-x-1 ${
                  showAccent
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--foreground)]/40 group-hover:text-[var(--accent)]'
                }`}
              >
                {showAccent ? '✓' : '↗'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
