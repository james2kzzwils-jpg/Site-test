import LoginForm from './LoginForm';

// Public login screen. Renders a single email field and asks Supabase
// to send a magic link. The actual `signInWithOtp` call lives in the
// client component because Supabase's OTP helpers expect the browser
// session.
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect = '/portal', error } = await searchParams;
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
          <span className="text-[var(--accent)]">◆</span> Client Portal
        </p>
        <h1 className="mb-3 font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Sign in to your project
        </h1>
        <p className="mb-10 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
          Enter the email address Epov used to invite you. A one-time sign-in
          link will arrive shortly — no password required.
        </p>
        <LoginForm redirectTo={redirect} initialError={error} />
      </div>
    </div>
  );
}
