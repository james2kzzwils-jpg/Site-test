import LoginForm from './LoginForm';

function getErrorMessage(error?: string) {
  if (!error) return null;

  if (error.includes('PKCE code verifier not found in storage')) {
    return 'Open the magic link in the same browser and device where you requested it. If needed, go back and request a fresh link.';
  }

  if (error.includes('email rate limit exceeded')) {
    return 'Too many email login attempts were made in a short time. Wait a bit before requesting another magic link.';
  }

  if (error === 'missing_code') {
    return 'The sign-in link was incomplete. Request a fresh magic link and try again.';
  }

  return error;
}

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
  const friendlyError = getErrorMessage(error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/45">
          <span className="text-[var(--accent)]">◆</span> Client Portal
        </p>
        <h1 className="mb-3 font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Sign in to your project
        </h1>
        <p className="mb-4 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
          Enter the email address Epov used to invite you. A one-time sign-in
          link will arrive shortly — no password required.
        </p>
        <p className="mb-10 text-[13px] leading-[1.7] text-[var(--foreground)]/45">
          Important: open the email link in the same browser and device where
          you requested it.
        </p>
        {friendlyError ? (
          <div className="mb-6 rounded-sm border border-[#ff6363]/35 bg-[#ff6363]/8 px-4 py-3 text-[13px] leading-[1.7] text-[#ffb3b3]">
            {friendlyError}
          </div>
        ) : null}
        <LoginForm redirectTo={redirect} initialError={undefined} />
      </div>
    </div>
  );
}
