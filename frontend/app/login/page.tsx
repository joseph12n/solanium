'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, KeyRound, Lock, Mail, Shield, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSession } from '@/lib/session-context';
import { useLanguage } from '@/lib/language-context';
import { ShineButton } from '@/components/ui/ShineButton';
import GradientText from '@/components/reactbits/GradientText';
import SplitText from '@/components/reactbits/SplitText';
import BlurText from '@/components/reactbits/BlurText';
import ShinyText from '@/components/reactbits/ShinyText';
import RotatingText from '@/components/reactbits/RotatingText';
import DecryptedText from '@/components/reactbits/DecryptedText';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import Particles from '@/components/reactbits/Particles';

type Mode = 'activate' | 'login';

const EASE = [0.23, 1, 0.32, 1] as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, token, loading } = useSession();
  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>('activate');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && token) router.replace('/');
  }, [loading, token, router]);

  const canSubmit = useMemo(() => {
    const codeOk = /^\d{6}$/.test(code);
    if (mode === 'activate') return codeOk;
    return codeOk && email.includes('@') && password.length >= 8;
  }, [mode, code, email, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { tenant } = await login({
        code: code.trim(),
        email: mode === 'login' ? email.trim() : undefined,
        password: mode === 'login' ? password : undefined,
      });
      router.replace(`/?welcome=${encodeURIComponent(tenant.nombre)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('login.invalidCredentials');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: 'rgb(var(--surface-base))', color: 'var(--text-primary)' }}
    >
      {/* ─── Aurora background ─── */}
      <Particles variant="aurora" className="absolute inset-0 pointer-events-none" />

      {/* Soft vignette to keep card legible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Subtle grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <pattern id="login-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)" />
      </svg>

      <div className="relative z-10 grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        {/* ─── Left — hero marketing ─── */}
        <section className="flex flex-col justify-between px-8 py-10 lg:px-16 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{
                background:
                  'linear-gradient(135deg, rgb(var(--brand-primary)), rgb(var(--brand-secondary)))',
                boxShadow: '0 8px 32px -12px rgb(var(--brand-primary) / 0.6)',
              }}
            >
              S
            </div>
            <GradientText
              colors={['#6e56cf', '#0a9d7f', '#22d3ee', '#6e56cf']}
              animationSpeed={6}
              className="font-semibold tracking-tight text-xl"
            >
              Solanium
            </GradientText>
          </motion.div>

          <div className="space-y-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
            >
              <ShinyText
                text={`· ${t('login.tagline')} ·`}
                speed={3}
                className="text-xs uppercase tracking-[0.22em] font-medium"
                color="#63636e"
                shineColor="#a1a1aa"
              />
            </motion.div>

            <div className="space-y-3">
              <SplitText
                text={t('login.heroLine1')}
                tag="h1"
                className="text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]"
                delay={0.02}
              />
              <div className="flex items-baseline gap-3 flex-wrap">
                <GradientText
                  colors={['#6e56cf', '#0a9d7f', '#22d3ee', '#6e56cf']}
                  animationSpeed={6}
                  className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
                >
                  {t('login.heroLine2')}
                </GradientText>
              </div>
            </div>

            <div
              className="flex items-center gap-2 text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>{t('login.builtFor')}</span>
              <RotatingText
                texts={[
                  t('login.rubro.papeleria'),
                  t('login.rubro.carniceria'),
                  t('login.rubro.electronica'),
                  t('login.rubro.yours'),
                ]}
                rotationInterval={2600}
                staggerDuration={0.03}
                mainClassName="text-lg font-medium"
                elementLevelClassName=""
              />
            </div>

            <BlurText
              text={t('login.heroDescription')}
              className="max-w-xl text-base leading-relaxed"
              delay={0.06}
            />

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4"
            >
              {[
                { icon: Shield, label: t('login.feat.validity'), hint: t('login.feat.validityHint') },
                { icon: Sparkles, label: t('login.feat.branding'), hint: t('login.feat.brandingHint') },
                { icon: KeyRound, label: t('login.feat.rotating'), hint: t('login.feat.rotatingHint') },
              ].map((f) => (
                <SpotlightCard
                  key={f.label}
                  spotlightColor="rgba(110, 86, 207, 0.14)"
                  className="p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'rgb(var(--brand-primary) / 0.1)',
                        color: 'rgb(var(--brand-primary))',
                      }}
                    >
                      <f.icon size={15} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {f.label}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {f.hint}
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>{t('login.noCodeYet')}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{t('login.contactVendor')}</span>
          </motion.div>
        </section>

        {/* ─── Right — login card ─── */}
        <section className="flex items-center justify-center px-8 py-10 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.15 }}
            className="w-full max-w-md"
          >
            <SpotlightCard
              spotlightColor="rgba(34, 211, 238, 0.16)"
              className="p-8 lg:p-10 backdrop-blur-xl"
            >
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <div
                    className="text-xs uppercase tracking-[0.2em] font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {mode === 'activate' ? t('login.step1') : t('login.signIn')}
                  </div>
                  <h2
                    className="text-2xl font-semibold tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {mode === 'activate' ? (
                      <>
                        {t('login.enterWith')}{' '}
                        <DecryptedText
                          text={t('login.codeWord')}
                          animateOn="view"
                          className=""
                          encryptedClassName=""
                        />
                      </>
                    ) : (
                      t('login.welcomeBack')
                    )}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {mode === 'activate' ? t('login.codeRotates') : t('login.signInHint')}
                  </p>
                </div>

                {/* Tabs */}
                <div
                  className="relative grid grid-cols-2 p-1 rounded-xl"
                  style={{
                    background: 'rgb(var(--surface-raised))',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {(['activate', 'login'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className="relative py-2 text-xs font-medium uppercase tracking-wider transition-colors rounded-lg"
                      style={{
                        color:
                          mode === m
                            ? 'rgb(var(--surface-base))'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {mode === m && (
                        <motion.span
                          layoutId="login-tab"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: 'var(--text-primary)' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">
                        {m === 'activate' ? t('login.tab.activate') : t('login.tab.signIn')}
                      </span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <CodeField value={code} onChange={setCode} t={t} />

                  <AnimatePresence initial={false}>
                    {mode === 'login' && (
                      <motion.div
                        key="creds"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="space-y-4 overflow-hidden"
                      >
                        <Field
                          label={t('common.email')}
                          icon={<Mail size={14} />}
                          type="email"
                          placeholder="tu@empresa.com"
                          value={email}
                          onChange={setEmail}
                          autoComplete="email"
                        />
                        <Field
                          label={t('common.password')}
                          icon={<Lock size={14} />}
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={setPassword}
                          autoComplete="current-password"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs rounded-lg px-3 py-2"
                      style={{
                        color: 'rgb(var(--danger))',
                        background: 'rgb(var(--danger) / 0.1)',
                        border: '1px solid rgb(var(--danger) / 0.2)',
                      }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <ShineButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!canSubmit || submitting}
                    icon={<ArrowRight size={14} />}
                    className="w-full"
                  >
                    {submitting
                      ? t('login.validating')
                      : mode === 'activate'
                      ? t('login.activate')
                      : t('login.enter')}
                  </ShineButton>

                  <div
                    className="text-[11px] text-center leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t('login.terms')}
                  </div>
                </form>
              </div>
            </SpotlightCard>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Local sub-components — input fields with theme-aware styling
// ═════════════════════════════════════════════════════════════════════

function Field({
  label,
  icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span
        className="text-xs uppercase tracking-wider font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        >
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pl-9 pr-3"
        />
      </div>
    </label>
  );
}

function CodeField({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  t: (key: string) => string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  const setDigit = (i: number, d: string) => {
    const clean = d.replace(/\D/g, '').slice(0, 1);
    const next = digits.map((x) => (x === ' ' ? '' : x));
    next[i] = clean;
    const joined = next.join('').slice(0, 6);
    onChange(joined);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <label className="block space-y-2">
      <span
        className="flex items-center justify-between text-xs uppercase tracking-wider font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="flex items-center gap-1.5">
          <KeyRound size={12} /> {t('login.accessCode')}
        </span>
        <span className="text-[10px] normal-case tracking-normal">
          {t('login.sixDigits')}
        </span>
      </span>
      <div className="grid grid-cols-6 gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d.trim()}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoComplete="one-time-code"
            className="aspect-square w-full text-center text-lg font-semibold font-mono !px-0"
          />
        ))}
      </div>
    </label>
  );
}
