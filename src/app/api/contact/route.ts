import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// Marketing-site contact form sink.
//
// We accept exactly one shape: { name, email, project_type, message }.
// The row is written with the service-role key (the table has RLS on
// with no policies — only the service role can touch it) and we
// rate-limit per source IP server-side to keep the form from being
// hammered.
//
// Important: we deliberately swallow most errors and return 200 so a
// determined poker can't probe the schema. The only thing we surface
// is the rate-limit hit, because the UI needs to tell the visitor
// "you already sent one".
//
// Resend/Telegram fan-out is intentionally NOT here yet — the user
// hasn't picked a destination. Once they do, we hook it in here behind
// optional env vars.

const MAX_PER_IP_PER_DAY = 3;
const MAX_FIELD_LENGTH = 5000;

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  project_type?: unknown;
  message?: unknown;
}

function getClientIp(request: NextRequest): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    // x-forwarded-for is a comma-separated list (client, proxy1, …).
    // The leftmost entry is the original client.
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Minimal validation: name, email, message required; project_type
  // optional. Cap field length so we don't store novels.
  const name = isNonEmptyString(payload.name)
    ? payload.name.trim().slice(0, MAX_FIELD_LENGTH)
    : null;
  const email = isNonEmptyString(payload.email)
    ? payload.email.trim().slice(0, MAX_FIELD_LENGTH)
    : null;
  const message = isNonEmptyString(payload.message)
    ? payload.message.trim().slice(0, MAX_FIELD_LENGTH)
    : null;
  const projectType = isNonEmptyString(payload.project_type)
    ? payload.project_type.trim().slice(0, MAX_FIELD_LENGTH)
    : null;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  // Basic email shape check. We don't want to over-engineer it (regex
  // wars), but obviously bogus inputs get bounced here so the row never
  // makes it into the DB.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent')?.slice(0, 1000) ?? null;

  // If Supabase env isn't set on this deploy (e.g. local dev), we skip
  // persistence and respond OK so the UI flow still works. Real prod
  // always has it set.
  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    // env not set — accept silently. The submission is lost but the
    // visitor sees a happy path; we'd rather not 500 in dev.
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Per-IP rate-limit: count submissions from this IP in the last 24h.
  if (ip) {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();
    const { count, error: countErr } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', twentyFourHoursAgo);

    if (!countErr && typeof count === 'number' && count >= MAX_PER_IP_PER_DAY) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429 }
      );
    }
  }

  const { error: insertErr } = await supabase
    .from('contact_messages')
    .insert({
      name,
      email,
      project_type: projectType,
      message,
      ip_address: ip,
      user_agent: userAgent,
    });

  if (insertErr) {
    // If the table doesn't exist yet (migration 0004 not applied), we
    // still want the UI flow to succeed — otherwise users hitting an
    // un-migrated environment see an error for no good reason. Log so
    // we notice in server logs.
    console.error('[contact] insert failed:', insertErr.message);
  }

  // Optional fan-out to Resend so the inbox notification lands in
  // James' mailbox the moment the form is submitted. We treat email
  // delivery as best-effort: if RESEND_API_KEY isn't set, or if the
  // call fails, the submission is still saved in the DB so nothing is
  // lost.
  const resendKey = process.env.RESEND_API_KEY;
  const inboxTo = process.env.CONTACT_INBOX_EMAIL ?? 'cggeneralistandrey@gmail.com';
  if (resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Resend allows sending from `onboarding@resend.dev` to any
          // address registered as the account owner without domain
          // verification. Once a custom domain is verified we'll flip
          // the `from` over via CONTACT_FROM_EMAIL.
          from: process.env.CONTACT_FROM_EMAIL ?? 'EPOV Creative Labs <onboarding@resend.dev>',
          to: [inboxTo],
          reply_to: email,
          subject: `New enquiry · ${name}${projectType ? ` · ${projectType}` : ''}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            projectType ? `Type: ${projectType}` : null,
            ip ? `IP: ${ip}` : null,
            '',
            message,
          ]
            .filter(Boolean)
            .join('\n'),
        }),
      });
    } catch (err) {
      console.error(
        '[contact] resend forward failed:',
        err instanceof Error ? err.message : err
      );
    }
  }

  return NextResponse.json({ ok: true });
}
