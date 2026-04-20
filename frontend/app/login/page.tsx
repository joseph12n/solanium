'use client';

/**
 * Hero de login — pantalla de entrada al SaaS Solanium.
 *
 * Dos modos, seleccionables por tabs:
 *   • "Activar sistema"  → sólo token (útil la primera vez que el cliente
 *                          abre el sistema con el token de 30 días que le
 *                          entregó el super-admin al comprar el plan)
 *   • "Iniciar sesión"   → token + email + password (acceso normal)
 *
 * Al completar verifica contra el backend:
 *   1. POST /api/activation/verify → valida el token y resuelve tenant
 *   2. POST /api/users/login (opcional) → identifica al usuario
 *
 * El fondo usa componentes de ReactBits: SplitText, BlurText, GradientText,
 * ShinyText, RotatingText, DecryptedText, SpotlightCard — aprovechando el
 * mandato del proyecto (ver CLAUDE.md: ReactBits obligatorio).
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, KeyRound, Lock, Mail, Shield, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSession } from '@/lib/session-context';
import { ShineButton } from '@/components/ui/ShineButton';
import GradientText from '@/components/reactbits/GradientText';
import SplitText from '@/components/reactbits/SplitText';
import BlurText from '@/components/reactbits/BlurText';
import ShinyText from '@/components/reactbits/ShinyText';
import RotatingText from '@/components/reactbits/RotatingText';
import DecryptedText from '@/components/reactbits/DecryptedText';
import SpotlightCard from '@/components/reactbits/SpotlightCard';

type Mode = 'activate' | 'login';

const EASE = [0.23, 1, 0.32, 1] as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, token, loading } = useSession();

  const [mode, setMode] = useState<Mode>('activate');
  const [activationToken, setActivationToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && token) router.replace('/');
  }, [loading, token, router]);

  const canSubmit = useMemo(() => {
    if (mode === 'activate') return activationToken.trim().length >= 16;
    return (
      activationToken.trim().length >= 16 &&
      email.includes('@') &&
      password.length >= 8
    );
  }, [mode, activationToken, email, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { tenant } = await login({
        token: activationToken.trim(),
        email: mode === 'login' ? email.trim() : undefined,
        password: mode === 'login' ? password : undefined,
      });
      // Una vez dentro, el layout adaptará el dashboard a tenant.tipo_negocio
      router.replace(`/?welcome=${encodeURIComponent(tenant.nombre)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No pudimos validar tus credenciales';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface-base text-ink-100">
      {/* ─── Background gradient + grid ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/3 -left-1/3 w-[800px] h-[800px] rounded-full bg-accent-500/20 blur-[120px]" />
        <div className="absolute -bottom-1/3 -right-1/3 w-[700px] h-[700px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,12,16,0.6)_100%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        {/* ─── Panel izquierdo — hero marketing ─── */}
        <section className="flex flex-col justify-between px-8 py-10 lg:px-16 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-primary flex items-center justify-center text-white font-bold shadow-glow-sm">
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
                text="· SaaS de facturación universal ·"
                speed={3}
                className="text-xs uppercase tracking-[0.22em] font-medium"
                color="#63636e"
                shineColor="#a1a1aa"
              />
            </motion.div>

            <div className="space-y-3">
              <SplitText
                text="Tu sistema,"
                tag="h1"
                className="text-5xl lg:text-6xl font-semibold tracking-tight text-ink-100 leading-[1.05]"
                delay={0.02}
              />
              <div className="flex items-baseline gap-3 flex-wrap">
                <GradientText
                  colors={['#6e56cf', '#0a9d7f', '#22d3ee', '#6e56cf']}
                  animationSpeed={6}
                  className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
                >
                  hecho a medida.
                </GradientText>
              </div>
            </div>

            <div className="flex items-center gap-2 text-lg text-ink-400">
              <span>Pensado para</span>
              <RotatingText
                texts={['papelerías', 'carnicerías', 'electrónica', 'tu rubro']}
                rotationInterval={2600}
                staggerDuration={0.03}
                mainClassName="text-lg font-medium text-accent-light"
                elementLevelClassName="text-accent-light"
              />
            </div>

            <BlurText
              text="Introduce el token que recibiste al contratar el plan. El sistema reconocerá tu rubro y desplegará automáticamente el panel adaptado a tu negocio."
              className="max-w-xl text-ink-400 text-base leading-relaxed"
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
                { icon: Shield, label: '30 días vigentes', hint: 'por token' },
                { icon: Sparkles, label: 'Branding propio', hint: 'logo + colores' },
                { icon: KeyRound, label: 'Plantilla lista', hint: 'al activar' },
              ].map((f, i) => (
                <SpotlightCard
                  key={f.label}
                  spotlightColor="rgba(110, 86, 207, 0.14)"
                  className="p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-500/10 text-accent-light flex items-center justify-center">
                      <f.icon size={15} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink-200">{f.label}</div>
                      <div className="text-xs text-ink-500">{f.hint}</div>
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
            className="flex items-center gap-2 text-xs text-ink-500"
          >
            <span>¿No tienes token aún?</span>
            <span className="text-ink-300">
              Contacta a tu vendedor Solanium para recibir tu licencia de 30 días.
            </span>
          </motion.div>
        </section>

        {/* ─── Panel derecho — card de login ─── */}
        <section className="flex items-center justify-center px-8 py-10 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.15 }}
            className="w-full max-w-md"
          >
            <SpotlightCard
              spotlightColor="rgba(34, 211, 238, 0.16)"
              className="p-8 lg:p-10 bg-surface-base/80 backdrop-blur-xl"
            >
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-[0.2em] font-medium text-ink-500">
                    {mode === 'activate' ? 'Paso 1 · Activación' : 'Iniciar sesión'}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-ink-100">
                    {mode === 'activate' ? (
                      <>
                        Entra con tu{' '}
                        <DecryptedText
                          text="token"
                          animateOn="view"
                          className="text-accent-light"
                          encryptedClassName="text-ink-700"
                        />
                      </>
                    ) : (
                      'Bienvenido de vuelta'
                    )}
                  </h2>
                  <p className="text-sm text-ink-500">
                    {mode === 'activate'
                      ? 'Pega el token de 30 días que te entregamos al comprar el plan.'
                      : 'Ingresa con tu cuenta del equipo para continuar.'}
                  </p>
                </div>

                {/* Tabs */}
                <div className="relative grid grid-cols-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  {(['activate', 'login'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`relative py-2 text-xs font-medium uppercase tracking-wider transition-colors rounded-lg ${
                        mode === m ? 'text-ink-950' : 'text-ink-400 hover:text-ink-200'
                      }`}
                    >
                      {mode === m && (
                        <motion.span
                          layoutId="login-tab"
                          className="absolute inset-0 rounded-lg bg-ink-100"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">
                        {m === 'activate' ? 'Activar' : 'Iniciar sesión'}
                      </span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <TokenField value={activationToken} onChange={setActivationToken} />

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
                          label="Email"
                          icon={<Mail size={14} />}
                          type="email"
                          placeholder="tu@empresa.com"
                          value={email}
                          onChange={setEmail}
                          autoComplete="email"
                        />
                        <Field
                          label="Contraseña"
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
                      className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
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
                      ? 'Validando…'
                      : mode === 'activate'
                      ? 'Activar sistema'
                      : 'Entrar'}
                  </ShineButton>

                  <div className="text-[11px] text-ink-600 text-center leading-relaxed">
                    Al continuar aceptas las condiciones del plan Solanium.
                    <br />
                    El token se verifica contra <code className="text-ink-400">/activation/verify</code>.
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
// Sub-componentes locales (inputs con glass + focus ring)
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
      <span className="text-xs uppercase tracking-wider font-medium text-ink-500">
        {label}
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-ink-100 placeholder-ink-600 outline-none transition-all focus:border-accent-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-accent-500/15"
        />
      </div>
    </label>
  );
}

function TokenField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-xs uppercase tracking-wider font-medium text-ink-500">
        <span>Token de activación</span>
        <span className="text-[10px] text-ink-600 normal-case tracking-normal">64 chars hex</span>
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
          <KeyRound size={14} />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="a1b2c3d4e5f6…"
          spellCheck={false}
          autoComplete="off"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-mono bg-white/[0.03] border border-white/[0.06] text-ink-100 placeholder-ink-700 outline-none transition-all focus:border-accent-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-accent-500/15"
        />
      </div>
    </label>
  );
}
