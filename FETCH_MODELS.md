# Fetch Models Feature

The Multi-LLM Comparison Tool now includes an automatic model fetching capability that allows users to dynamically retrieve available models from their configured providers instead of manually typing model names. **Now supports both authenticated and unauthenticated providers including local LLMs!**

## How It Works

### 1. Provider Setup
When adding a new LLM provider, you can now:
1. Select from presets including local/unauthenticated options
2. Enter the provider name and API URL
3. Add API key only if required (many local providers don't need authentication)
4. Click the **"Fetch Models"** button to automatically retrieve available models
5. Select from a dropdown of available models instead of typing manually

### 2. Supported Providers

#### Cloud Providers (Require Authentication)

**OpenAI**
- Fetches models from `/v1/models` endpoint
- Filters for GPT models (gpt-4o, gpt-4-turbo, gpt-3.5-turbo, etc.)
- Automatically sorts models alphabetically

**Anthropic**
- Uses a curated list of known Claude models
- Includes latest Claude 3.5 Sonnet, Haiku, and Opus models
- No API call needed (Anthropic doesn't expose a public models endpoint)

**Google (Gemini)**
- Fetches from `/v1/models` endpoint
- Filters for Gemini models that support text generation
- Includes Gemini 1.5 Pro, Flash, and other variants

#### Local Providers (No Authentication Required)

**LM Studio** 
- Supports HTTP endpoints (default: `http://localhost:1234`)
- Uses OpenAI-compatible API format
- Fetches from `/v1/models` endpoint
- No API key required

**Ollama**
- Supports HTTP endpoints (default: `http://localhost:11434`)
- Fetches from `/api/tags` endpoint
- Returns locally installed models
- No API key required

**Text Generation WebUI**
- Supports HTTP endpoints (default: `http://localhost:5000`)
- Uses OpenAI-compatible API format
- Fetches from `/v1/models` endpoint
- No API key required

#### Custom Providers
- Attempts to fetch from common endpoints (`/v1/models`, `/models`, `/api/models`)
- Supports both authenticated and unauthenticated endpoints
- Supports various response formats
- Falls back to manual entry if fetching fails
- Toggle authentication requirement for custom providers

### 3. HTTP & HTTPS Support

- **HTTPS**: Fully supported for cloud providers (OpenAI, Anthropic, Google)
- **HTTP**: Fully supported for local providers (LM Studio, Ollama, Text Generation WebUI)
- **Mixed environments**: Can use both HTTP and HTTPS providers simultaneously
- **Local development**: Perfect for testing with local LLM servers

### 4. Authentication Flexibility

**Authenticated Providers:**
- API key field is required and validated
- Encrypted storage of API keys
- Secure transmission to provider endpoints

**Unauthenticated Providers:**
- API key field is hidden
- Clear "No Authentication Required" indicator
- Direct connection to local endpoints

**Custom Providers:**
- Toggle authentication requirement
- Flexible configuration for any endpoint
- Auto-detection of authentication needs

### 5. User Experience

**Before Fetching:**
- Model field shows as a text input
- User must manually type model names
- Risk of typos or using incorrect model names

**After Fetching:**
- Model field becomes a dropdown with available options
- Models are automatically validated and current
- Fallback to manual entry if no models found

### 6. Error Handling

- If fetching fails, users can still enter model names manually
- Clear error messages guide users when API credentials are missing
- Graceful fallback for providers without model listing APIs
- HTTP/HTTPS connection error handling
- Timeout protection for slow local servers

### 7. Benefits

- **Local LLM Support**: Full compatibility with popular local LLM tools
- **No Authentication Hassles**: Use local providers without API keys
- **HTTP Support**: Works with local development environments
- **Accuracy**: Eliminates typos in model names
- **Discovery**: Users can see all available models (local or cloud)
- **Convenience**: No need to look up model names in documentation
- **Current**: Always shows the latest available models from any provider

## Usage Instructions

### For Cloud Providers (OpenAI, Anthropic, Google)
1. **Add Provider**: Click "Add Provider" button
2. **Select Preset**: Choose from OpenAI, Anthropic, or Google
3. **Enter API Key**: Provide your API key
4. **Fetch Models**: Click the green "Fetch Models" button
5. **Select Model**: Choose from the dropdown of available models
6. **Save**: Complete the provider configuration

### For Local Providers (LM Studio, Ollama, etc.)
1. **Add Provider**: Click "Add Provider" button
2. **Select Preset**: Choose LM Studio, Ollama, or Text Generation WebUI
3. **Verify URL**: Confirm the local endpoint URL (e.g., `http://localhost:1234`)
4. **Fetch Models**: Click the green "Fetch Models" button (no API key needed!)
5. **Select Model**: Choose from your locally installed models
6. **Save**: Complete the provider configuration

### For Custom Providers
1. **Add Provider**: Click "Add Provider" button
2. **Select Custom**: Choose the custom preset
3. **Configure**: Enter name, URL, and toggle authentication if needed
4. **Add API Key**: Only if authentication is required
5. **Fetch Models**: Click the green "Fetch Models" button
6. **Select Model**: Choose from available models or enter manually
7. **Save**: Complete the provider configuration

The feature automatically handles different API formats and provides a consistent experience across all supported providers, whether they're running in the cloud or on your local machine!