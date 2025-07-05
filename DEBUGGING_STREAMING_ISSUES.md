# Debugging Streaming Issues - LM Studio & Anthropic

## Overview

This guide helps debug why LM Studio and Anthropic responses are not loading while OpenAI works correctly. The issue likely stems from provider-specific differences in streaming implementation, response formats, or network configuration.

## Enhanced Debugging Features

### 1. Debug Logging
- **Development Mode**: Enhanced console logging is enabled automatically in development
- **Provider-specific logs**: Each provider has detailed request/response logging
- **Error tracking**: Comprehensive error capture with context

### 2. Streaming Debugger Component
- **Debug Button**: Added to each provider card (bug icon)
- **Test Types**:
  - **Connection Test**: Validates basic endpoint connectivity
  - **Streaming Test**: Tests actual streaming responses
  - **Parsing Test**: Validates response format parsing

### 3. Automatic Fallback
- **Graceful Degradation**: If streaming fails, automatically falls back to non-streaming
- **User Notification**: Clear indication when fallback is used
- **Error Logging**: Detailed logs of why streaming failed

## Common Issues & Solutions

### 1. LM Studio Issues

#### **Most Likely Causes:**
1. **CORS Configuration**: LM Studio might not have proper CORS headers for streaming
2. **Streaming Format**: Slightly different SSE format than standard OpenAI
3. **Connection Issues**: Local server connectivity problems
4. **Model Loading**: Model not properly loaded or serving

#### **Debugging Steps:**
1. **Check LM Studio Status**:
   ```bash
   curl http://localhost:1234/v1/models
   ```

2. **Test Streaming Manually**:
   ```bash
   curl -X POST http://localhost:1234/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Accept: text/event-stream" \
     -d '{
       "model": "your-model",
       "messages": [{"role": "user", "content": "Hello"}],
       "stream": true
     }'
   ```

3. **Use Debug Component**:
   - Click the bug icon on LM Studio provider card
   - Run "Connection Test" first
   - Then run "Streaming Test"
   - Check browser console for detailed logs

#### **Common Fixes:**
- **Enable CORS** in LM Studio settings
- **Restart LM Studio** server
- **Check firewall** settings
- **Verify model is loaded** and active

### 2. Anthropic Issues

#### **Most Likely Causes:**
1. **API Key Issues**: Missing or invalid API key
2. **Header Requirements**: Missing required `anthropic-version` header
3. **Response Format**: Different streaming event types than OpenAI
4. **Rate Limiting**: API rate limits or quota issues

#### **Debugging Steps:**
1. **Verify API Key**:
   ```bash
   curl -X GET https://api.anthropic.com/v1/models \
     -H "x-api-key: your-api-key" \
     -H "anthropic-version: 2023-06-01"
   ```

2. **Test Streaming**:
   ```bash
   curl -X POST https://api.anthropic.com/v1/messages \
     -H "x-api-key: your-api-key" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -H "accept: text/event-stream" \
     -d '{
       "model": "claude-3-sonnet-20240229",
       "max_tokens": 100,
       "messages": [{"role": "user", "content": "Hello"}],
       "stream": true
     }'
   ```

3. **Use Debug Component**:
   - Click bug icon on Anthropic provider card
   - Run all three test types
   - Pay attention to authentication errors

#### **Common Fixes:**
- **Check API Key**: Ensure it's valid and has proper permissions
- **Verify Quota**: Check your Anthropic account usage
- **Update Headers**: Ensure `anthropic-version` header is included
- **Check Model Names**: Use exact model names from Anthropic

### 3. Network & CORS Issues

#### **Diagnosis:**
- **Browser Console**: Check for CORS errors
- **Network Tab**: Inspect actual request/response
- **Proxy Logs**: Check Next.js proxy logs

#### **Common Patterns:**
```
// LM Studio CORS Error
Access to fetch at 'http://localhost:1234/v1/chat/completions' 
from origin 'http://localhost:3000' has been blocked by CORS policy

// Anthropic Auth Error
{"error":{"type":"authentication_error","message":"invalid x-api-key"}}

// Network Timeout
TypeError: Failed to fetch
```

## Implementation Details

### 1. Enhanced Parsing Logic

The streaming parser now handles:

**OpenAI/LM Studio Format:**
```json
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

**Anthropic Format:**
```json
data: {"type":"message_start","message":{...}}
data: {"type":"content_block_start","index":0,"content_block":{...}}
data: {"type":"content_block_delta","index":0,"delta":{"text":"Hello"}}
data: {"type":"content_block_delta","index":0,"delta":{"text":" world"}}
data: {"type":"content_block_stop","index":0}
data: {"type":"message_stop"}
```

### 2. Error Handling Improvements

- **Graceful Degradation**: Automatic fallback to non-streaming
- **Context Preservation**: Error logs include full request context
- **User Feedback**: Clear error messages and status indicators

### 3. Debug Tools

- **Real-time Testing**: Test streaming without making actual queries
- **Format Validation**: Verify response parsing logic
- **Connection Verification**: Test basic connectivity

## Browser Console Debugging

### Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('debug', 'true');
// Refresh page
```

### Key Log Messages to Look For

**Successful Streaming:**
```
[LM Studio] Building streaming request: {...}
[LM Studio] Starting to read streaming response
[LM Studio] Chunk 1: data: {"choices":[{"delta":{"content":"Hello"}}]}
[LM Studio] Extracted content: "Hello"
[LM Studio] Streaming completed. Total chunks: 5
```

**Authentication Issues:**
```
[Anthropic] No API key provided - request will likely fail
[Anthropic] API Error: {"error": {"type": "authentication_error"}}
```

**Network Issues:**
```
[LM Studio] Streaming request failed: 500 Internal Server Error
[Streaming Proxy] Request failed: {...}
```

**Parsing Issues:**
```
[Anthropic] Failed to parse JSON in streaming line: {...}
[Anthropic] Unhandled Anthropic event type: unknown_type
```

## Testing Checklist

### Before Debugging:
- [ ] Provider is active (green dot)
- [ ] API credentials are correct
- [ ] Network connection is stable
- [ ] LM Studio server is running (if applicable)

### Debug Process:
1. [ ] Click debug button on failing provider
2. [ ] Run Connection Test
3. [ ] Run Streaming Test
4. [ ] Check browser console logs
5. [ ] Try non-streaming mode
6. [ ] Compare with working OpenAI provider

### Common Resolution Steps:
- [ ] Restart LM Studio server
- [ ] Verify API keys
- [ ] Check firewall/antivirus
- [ ] Update provider configuration
- [ ] Test with minimal prompt

## Known Working Configurations

### LM Studio
```json
{
  "name": "LM Studio",
  "apiUrl": "http://localhost:1234",
  "model": "local-model",
  "customHeaders": {
    "Accept": "text/event-stream",
    "Cache-Control": "no-cache"
  }
}
```

### Anthropic
```json
{
  "name": "Anthropic Claude",
  "apiUrl": "https://api.anthropic.com",
  "model": "claude-3-sonnet-20240229",
  "apiKey": "sk-ant-...",
  "customHeaders": {
    "anthropic-version": "2023-06-01"
  }
}
```

## Getting Help

If issues persist:

1. **Check Logs**: Look for specific error patterns in console
2. **Test Isolation**: Try one provider at a time
3. **Network Analysis**: Use browser dev tools Network tab
4. **Provider Status**: Check LM Studio/Anthropic service status
5. **Fallback Testing**: Disable streaming to test basic connectivity

The enhanced debugging tools should help identify the specific cause of streaming failures and provide clear paths to resolution.