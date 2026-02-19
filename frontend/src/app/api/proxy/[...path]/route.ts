import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    // Await params if necessary (Next.js future proofing), currently direct access works in most 13/14 ver
    // But strictly typing it:
    const { path } = await params;

    // Construct target URL
    const pathJoined = path.join('/');
    const queryString = request.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/${pathJoined}${queryString}`;

    console.log(`[Proxy] ${request.method} -> ${targetUrl}`);

    // Forward Headers
    const headers = new Headers(request.headers);

    // Important: overwrite Host to match backend (though usually fetch handles this, 
    // explicit set is safer if backend relies on it for vhost)
    try {
        const backendHost = new URL(BACKEND_URL).host;
        headers.set('host', backendHost);
        // We might also want to set X-Forwarded-Host if not present
        headers.set('X-Forwarded-Host', request.headers.get('host') || '');
    } catch (e) {
        console.warn('[Proxy] Invalid BACKEND_URL', BACKEND_URL);
    }

    try {
        const backendResponse = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: request.body,
            redirect: 'manual',
            // @ts-ignore - Required for body forwarding in Node fetch
            duplex: 'half',
        });

        console.log(`[Proxy] <- ${backendResponse.status} ${backendResponse.statusText}`);

        // Forward Response Headers
        const responseHeaders = new Headers(backendResponse.headers);

        // Clean up headers that shouldn't be forwarded unchanged
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');

        // IMPORTANT: The Set-Cookie header IS forwarded automatically by new Headers(backendResponse.headers)
        // Next.js NextResponse will send it to the browser.
        // We log it just to be sure.
        const setCookie = responseHeaders.get('set-cookie');
        if (setCookie) {
            console.log(`[Proxy] Backend returned Set-Cookie: present`);
        }

        return new NextResponse(backendResponse.body, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('[Proxy] Forwarding Error:', error);
        return NextResponse.json(
            { error: 'Proxy Error', details: error instanceof Error ? error.message : String(error) },
            { status: 502 }
        );
    }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
