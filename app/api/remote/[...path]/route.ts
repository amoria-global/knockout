import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

const ALLOWED_ORIGINS = new Set<string>([
  'https://connekyt.com',
  'https://www.connekyt.com',
  'https://dashboard.connekyt.com',
  'http://localhost:3000',
  'http://localhost:3001',
]);

/** Allow any http:// private-network origin in development (LAN mobile testing). */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (process.env.NODE_ENV !== 'production') {
    const lanPattern = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)\d+\.\d+(:\d+)?$/;
    if (lanPattern.test(origin)) return true;
  }
  return false;
}

const REQUEST_TIMEOUT_MS = 30_000;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'GET');
}
export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'POST');
}
export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'PUT');
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'PATCH');
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'DELETE');
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  if (origin && isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    };
  }
  return {};
}

function isPathSafe(joined: string): boolean {
  // We always prepend "api/remote/". Just guard against traversal here.
  return !joined.includes('..') && !joined.includes('\\') && !joined.includes('\0');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const origin = request.headers.get('origin');
  const cors = corsHeadersFor(origin);

  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  const joined = pathSegments.join('/');
  if (!isPathSafe(joined)) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 400, headers: cors }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const path = 'api/remote/' + joined;
    const url = new URL(path, API_BASE_URL);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const incomingContentType = request.headers.get('content-type') || '';
    const isMultipart = incomingContentType.includes('multipart/form-data');

    const headers: HeadersInit = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    // Forward browser cookies so the backend can read amoria_auth (HttpOnly
    // session cookie).
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Forward the real client IP so the backend can geo-resolve the visitor's
    // country (geo-pricing + geo-restriction). Without this the backend only
    // sees this proxy server's IP and every web visitor would resolve to the
    // server's region. CountryResolver reads the first X-Forwarded-For hop.
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor || realIp;
    if (clientIp) {
      headers['X-Forwarded-For'] = clientIp;
    }
    if (realIp) {
      headers['X-Real-IP'] = realIp;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (method !== 'GET' && method !== 'DELETE') {
      if (isMultipart) {
        const formData = await request.formData();
        fetchOptions.body = formData;
      } else {
        try {
          const body = await request.json();
          fetchOptions.body = JSON.stringify(body);
        } catch {
          // No body or invalid JSON - continue without body
        }
      }
    }

    const response = await fetch(url.toString(), fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Echo Set-Cookie headers from the backend so login/logout cookie
    // lifecycle lands in the browser.
    const responseHeaders = new Headers(cors);
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
    for (const sc of setCookies) responseHeaders.append('Set-Cookie', sc);

    if (isJson) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Cache-Control', 'public, max-age=86400');
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: aborted ? 'Upstream timeout' : 'Proxy request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: aborted ? 504 : 502, headers: cors }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeadersFor(origin);
  return new NextResponse(null, {
    status: 204,
    headers: cors,
  });
}
