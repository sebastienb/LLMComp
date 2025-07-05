import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, headers, data, method = 'POST' } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Remove host and origin headers that could cause issues
    const cleanHeaders = { ...headers };
    delete cleanHeaders['host'];
    delete cleanHeaders['origin'];
    delete cleanHeaders['referer'];

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...cleanHeaders,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxy request failed: ${response.status} ${response.statusText}`, {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`, 
          details: errorText,
          url,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const headersParam = searchParams.get('headers');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let headers: Record<string, string> = {};
    if (headersParam) {
      try {
        headers = JSON.parse(headersParam);
      } catch {
        // Ignore invalid headers
      }
    }

    // Remove problematic headers
    const cleanHeaders = { ...headers };
    delete cleanHeaders['host'];
    delete cleanHeaders['origin'];
    delete cleanHeaders['referer'];

    const response = await fetch(url, {
      method: 'GET',
      headers: cleanHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxy request failed: ${response.status} ${response.statusText}`, {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`, 
          details: errorText,
          url,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}