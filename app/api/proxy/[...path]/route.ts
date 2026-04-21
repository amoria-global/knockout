import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com/';

// Only same-origin + sibling apps may use this proxy. Add/remove as needed.
const ALLOWED_ORIGINS = new Set<string>([
  'https://connekyt.com',
  'https://www.connekyt.com',
  'https://dashboard.connekyt.com',
  // dev
  'http://localhost:3000',
  'http://localhost:3001',
]);

// Only backend paths under these prefixes are proxiable. Anything else → 403.
// Keeps this route from being abused as a generic reverse proxy.
const ALLOWED_PATH_PREFIXES = [
  'api/remote/',
  'uploads/',
];

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
  // Echo back the specific Origin if allowed; never wildcard. If the origin is
  // not in the allow-list, return no CORS headers — browser will reject the response.
  if (origin && ALLOWED_ORIGINS.has(origin)) {
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

function isPathAllowed(path: string): boolean {
  // Block traversal + backslash
  if (path.includes('..') || path.includes('\\') || path.includes('\0')) return false;
  return ALLOWED_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const origin = request.headers.get('origin');
  const cors = corsHeadersFor(origin);

  // Reject cross-origin requests from disallowed origins (defense in depth;
  // browsers already enforce this via CORS preflight, but server-side rejection
  // stops non-browser clients too).
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  const path = pathSegments.join('/');
  if (!isPathAllowed(path)) {
    return NextResponse.json(
      { error: 'Path not allowed by proxy', path },
      { status: 403, headers: cors }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
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
          // No body or invalid JSON — continue without body
        }
      }
    }

    const response = await fetch(url.toString(), fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, {
        status: response.status,
        headers: cors,
      });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        ...cors,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
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
