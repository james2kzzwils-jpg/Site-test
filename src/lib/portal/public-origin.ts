type HeaderReader = {
  get(name: string): string | null;
};

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null;
}

function normalizeOrigin(raw: string | null | undefined) {
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalHost(host: string | null) {
  return Boolean(host && LOCAL_HOST_RE.test(host));
}

function configuredPortalOrigin() {
  return (
    normalizeOrigin(process.env.PORTAL_PUBLIC_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_PORTAL_URL)
  );
}

function originFromHeaders(headers: HeaderReader, defaultProto: 'http' | 'https') {
  const host =
    firstHeaderValue(headers.get('x-forwarded-host')) ??
    firstHeaderValue(headers.get('host'));
  if (!host || isLocalHost(host)) return null;

  const protoHeader = firstHeaderValue(headers.get('x-forwarded-proto'));
  const proto = protoHeader === 'http' || protoHeader === 'https' ? protoHeader : defaultProto;
  return `${proto}://${host}`;
}

export function getPublicPortalOriginFromHeaders(headers: HeaderReader) {
  return (
    configuredPortalOrigin() ??
    originFromHeaders(
      headers,
      process.env.NODE_ENV === 'production' ? 'https' : 'http'
    ) ??
    'http://localhost:3000'
  );
}

export function getPublicPortalOriginFromRequest(args: {
  headers: HeaderReader;
  fallbackOrigin?: string | null;
}) {
  return (
    configuredPortalOrigin() ??
    originFromHeaders(
      args.headers,
      process.env.NODE_ENV === 'production' ? 'https' : 'http'
    ) ??
    normalizeOrigin(args.fallbackOrigin) ??
    'http://localhost:3000'
  );
}
