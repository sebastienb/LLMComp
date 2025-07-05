import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, headers, data } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Enhanced debug logging
    const isDebugMode = process.env.NODE_ENV === 'development';
    
    if (isDebugMode) {
      console.log('[Streaming Proxy] Request details:', {
        url,
        method: 'POST',
        headers: Object.keys(headers || {}),
        dataKeys: Object.keys(data || {}),
        hasStream: data?.stream
      });
    }

    // Remove host and origin headers that could cause issues
    const cleanHeaders = { ...headers };
    delete cleanHeaders['host'];
    delete cleanHeaders['origin'];
    delete cleanHeaders['referer'];

    // Enable streaming in the request
    const streamingData = {
      ...data,
      stream: true,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...cleanHeaders,
      },
      body: JSON.stringify(streamingData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorDetails = {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries()),
        requestData: streamingData
      };
      
      console.error('[Streaming Proxy] Request failed:', errorDetails);
      
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`, 
          details: errorText,
          url,
          status: response.status,
          provider: data?.model || 'unknown'
        },
        { status: response.status }
      );
    }

    // Check if the response is actually streaming
    if (!response.body) {
      console.error('[Streaming Proxy] No response body received');
      return NextResponse.json({ error: 'No response body' }, { status: 500 });
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (isDebugMode) {
      console.log('[Streaming Proxy] Response content-type:', contentType);
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let chunkCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        
        try {
          if (isDebugMode) {
            console.log('[Streaming Proxy] Starting to read response stream');
          }
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              if (isDebugMode) {
                console.log(`[Streaming Proxy] Stream completed. Total chunks: ${chunkCount}`);
              }
              controller.close();
              break;
            }
            
            chunkCount++;
            
            // Decode the chunk and forward it
            const chunk = decoder.decode(value, { stream: true });
            
            if (isDebugMode && chunkCount <= 5) {
              console.log(`[Streaming Proxy] Chunk ${chunkCount} (${chunk.length} chars):`, chunk);
            }
            
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error('[Streaming Proxy] Streaming error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            chunkCount,
            url
          });
          
          // Send error information as SSE event
          const errorEvent = `data: ${JSON.stringify({ error: 'Streaming interrupted', details: error instanceof Error ? error.message : 'Unknown error' })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version',
      },
    });

  } catch (error) {
    console.error('[Streaming Proxy] Proxy error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Streaming proxy request failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}