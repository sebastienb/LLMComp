// Debug utilities for streaming responses
export const debugConfig = {
  enableStreamingDebug: process.env.NODE_ENV === 'development',
  logLevel: 'info' as 'error' | 'warn' | 'info' | 'debug',
};

export function debugLog(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) {
  if (!debugConfig.enableStreamingDebug) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  switch (level) {
    case 'error':
      console.error(logMessage, data);
      break;
    case 'warn':
      console.warn(logMessage, data);
      break;
    case 'info':
      console.info(logMessage, data);
      break;
    case 'debug':
      console.debug(logMessage, data);
      break;
  }
}

export function testStreamingEndpoint(url: string, headers: Record<string, string>, data: any) {
  if (!debugConfig.enableStreamingDebug) return;
  
  debugLog('info', 'Testing streaming endpoint', {
    url,
    headers: Object.keys(headers),
    data: {
      model: data.model,
      hasMessages: !!data.messages,
      hasPrompt: !!data.prompt,
      stream: data.stream,
      temperature: data.temperature,
      max_tokens: data.max_tokens,
    }
  });
}

export function validateStreamingResponse(response: Response, provider: string) {
  if (!debugConfig.enableStreamingDebug) return;
  
  const contentType = response.headers.get('content-type');
  const transferEncoding = response.headers.get('transfer-encoding');
  
  debugLog('info', `Streaming response validation for ${provider}`, {
    status: response.status,
    statusText: response.statusText,
    contentType,
    transferEncoding,
    hasBody: !!response.body,
    headers: Object.fromEntries(response.headers.entries()),
  });
  
  // Check for common issues
  if (!contentType?.includes('text/') && !contentType?.includes('application/')) {
    debugLog('warn', `Unexpected content type for ${provider}`, { contentType });
  }
  
  if (!response.body) {
    debugLog('error', `No response body for ${provider}`);
  }
}

export function analyzeStreamingChunk(chunk: string, provider: string, chunkNumber: number) {
  if (!debugConfig.enableStreamingDebug || chunkNumber > 5) return;
  
  debugLog('debug', `Chunk analysis for ${provider} #${chunkNumber}`, {
    length: chunk.length,
    startsWithData: chunk.startsWith('data:'),
    linesCount: chunk.split('\n').length,
    hasJSON: chunk.includes('{'),
    sample: chunk.substring(0, 200),
  });
}

export function reportStreamingError(error: Error, provider: string, context?: any) {
  debugLog('error', `Streaming error for ${provider}`, {
    message: error.message,
    stack: error.stack,
    context,
  });
}