# Multi-LLM Comparison Tool

A powerful, real-time web application for comparing responses from multiple Large Language Model (LLM) providers side-by-side. Test prompts across OpenAI, Anthropic, Google, local models, and custom providers simultaneously.

![Multi-LLM Comparison Tool](https://img.shields.io/badge/Next.js-14+-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

## ✨ Features

### 🚀 **Real-time Streaming Responses**
- Live streaming of LLM responses as they generate
- Visual indicators for active streaming
- Timeout prevention for slow local models
- Automatic fallback to non-streaming when needed

### 🔗 **Multi-Provider Support**
- **Cloud Providers**: OpenAI, Anthropic, Google Gemini
- **Local Models**: LM Studio, Ollama, Text Generation WebUI  
- **Custom Endpoints**: Configure any OpenAI-compatible API
- **Dynamic Model Fetching**: Automatically discover available models

### 🛡️ **Secure & Private**
- Client-side API key encryption using AES
- No server-side storage of sensitive data
- Local storage with encryption for persistence
- Clear privacy controls and indicators

### 💼 **Professional Interface**
- Side-by-side response comparison with rich markdown rendering
- Configurable prompt parameters (temperature, tokens, top-p)
- System prompt support with visual indicators
- Response metadata (timing, tokens, cost estimates)
- Copy to clipboard and fullscreen viewing with syntax highlighting

### 🎨 **Multiple UI Themes**
- **Default Theme**: Clean, spacious layout with professional styling
- **TUI Theme**: Terminal-inspired interface for maximum efficiency and compact display
- **Monitor Theme**: Dark monitoring interface with professional status indicators
- Live theme preview and switching without page refresh
- Consistent theming across all pages including history dashboard

### 📊 **Advanced History Dashboard**
- Dedicated history page with table-style layout
- Provider performance comparison at a glance
- Response time and token usage tracking
- Search functionality across all historical data
- One-click prompt reuse with settings restoration

### 🎨 **Rich Content Rendering**
- Professional markdown rendering with syntax highlighting
- GitHub Flavored Markdown support (tables, code blocks, lists)
- Theme-aware code highlighting optimized for each UI theme
- Responsive content display with proper typography

### 🔧 **Developer-Friendly**
- Comprehensive error handling with clear messages
- Built-in debugging tools for troubleshooting
- CORS proxy for seamless API integration
- Provider-specific setup guidance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/llcomp.git
   cd llcomp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📖 Usage Guide

### 1. **Add Your First Provider**

Click "Add Provider" and configure your LLM:

**For Cloud Providers (OpenAI, Anthropic, Google):**
- Select provider preset
- Enter your API key
- Click "Fetch Models" to get available models
- Test connection to verify setup

**For Local Providers (LM Studio, Ollama):**
- Select the local provider preset
- Update the API URL if different from default
- No API key required
- Click "Fetch Models" to discover local models

### 2. **Configure Multiple Providers**

Add as many providers as you want to compare. Each provider can be:
- ✅ **Active**: Included in comparisons (green dot)
- ⚪ **Inactive**: Excluded from comparisons (gray dot)

Click the colored dot next to any provider name to toggle its status.

### 3. **Run Comparisons**

1. Enter your prompt in the text area
2. Configure advanced options if needed:
   - **System Prompt**: Set behavior/role instructions
   - **Temperature**: Control randomness (0.0 = deterministic, 2.0 = very creative)
   - **Max Tokens**: Limit response length
   - **Top P**: Control diversity of token selection
   - **Enable Streaming**: Real-time response updates (recommended)
3. Click "Run All" to send to all active providers
4. Watch responses stream in real-time

### 4. **Analyze Results**

Each response card shows:
- **Provider name and model**
- **Rich markdown content** with syntax highlighting
- **Response time** in milliseconds
- **Token usage** (prompt + completion + total)
- **Estimated cost** (when available)
- **Status indicators** (Pending → Streaming → Completed)

Use the comparison to evaluate:
- **Quality**: Which response best answers your prompt?
- **Speed**: Which provider responds fastest?
- **Cost**: Which offers the best value?
- **Style**: How do writing styles differ?
- **Formatting**: How well does each provider handle code, tables, and lists?

### 5. **Review History**

Access your response history through:
- **Header navigation**: Click the clock icon
- **Prompt section**: Click the "History" button

The history page provides:
- **Table view**: All prompts with provider responses in columns
- **Performance metrics**: Response times, token counts, and costs
- **Search functionality**: Find specific prompts or responses
- **Quick reuse**: One-click to restore any historical prompt
- **Detailed viewing**: Click "View Response" for full markdown rendering

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for any custom configuration:

```env
# Optional: Custom API timeouts (in milliseconds)
NEXT_PUBLIC_DEFAULT_TIMEOUT=30000

# Optional: Enable additional debug logging
NEXT_PUBLIC_DEBUG_MODE=true
```

### Provider Setup

#### OpenAI
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Select OpenAI preset
3. Paste API key and test connection

#### Anthropic  
1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Select Anthropic preset
3. Paste API key and test connection

#### Google Gemini
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Select Google preset  
3. Paste API key and test connection

#### LM Studio (Local)
1. Install and start [LM Studio](https://lmstudio.ai/)
2. Load a model and start the local server
3. Use default URL `http://localhost:1234` or update as needed
4. Enable CORS in LM Studio settings
5. No API key required

#### Ollama (Local)
1. Install [Ollama](https://ollama.ai/) and pull models
2. Start Ollama service
3. Use default URL `http://localhost:11434` or update as needed
4. No API key required

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand with persistence
- **Security**: Client-side AES encryption (crypto-js)
- **HTTP Client**: Native fetch with streaming support

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes for CORS proxy
│   ├── history/           # Dedicated history page
│   │   └── page.tsx       # History dashboard with table layout
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles with markdown utilities
├── components/            # React components
│   ├── Header.tsx         # App header with navigation
│   ├── MarkdownRenderer.tsx # Rich content rendering with syntax highlighting
│   ├── PromptInput.tsx    # Prompt input and controls
│   ├── ResponseCard.tsx   # Individual response display with markdown
│   ├── ResponseGrid.tsx   # Response layout manager
│   ├── ProviderModal.tsx  # Provider configuration modal
│   ├── SettingsModal.tsx  # Global settings
│   └── ThemePicker.tsx    # Theme selection modal with live preview
├── hooks/                 # Custom React hooks
│   └── useStreamingLLM.ts # Streaming response handler
├── lib/                   # Utility libraries
│   ├── api.ts            # API integration layer
│   ├── crypto.ts         # Encryption utilities
│   └── themes.ts         # Theme system with multiple UI paradigms
├── stores/               # State management
│   └── useStore.ts       # Zustand store with history persistence
└── types/                # TypeScript definitions
    └── index.ts          # Shared type definitions
```

### Key Features Implementation

#### Streaming Architecture
```
Frontend → Next.js Proxy → LLM Provider API
       ← Real-time SSE ←
```

- **Client**: Initiates streaming request via custom hook
- **Proxy**: Next.js API route handles CORS and forwards requests  
- **Parsing**: Provider-specific response format handling
- **Updates**: Real-time UI updates via Zustand store

#### Security Model
- **API Keys**: AES encrypted before localStorage
- **No Server Storage**: All sensitive data stays client-side
- **CORS Proxy**: Server never sees or stores API keys
- **Automatic Cleanup**: Keys cleared on logout/reset

## 🐛 Troubleshooting

### Common Issues

#### "Network Error" or CORS Issues
- **Solution**: The app uses a built-in CORS proxy
- **Check**: Ensure the LLM provider URL is correct
- **Local providers**: Verify the local server is running

#### LM Studio Not Working
1. **Verify LM Studio is running** with a model loaded
2. **Check the API URL** (default: `http://localhost:1234`)
3. **Enable CORS** in LM Studio → Settings → Server
4. **Test connection** using the "Test Connection" button
5. **Check firewall** settings if using a non-localhost URL

#### API Key Issues
- **Encrypted keys not working**: Try deleting and re-adding the provider
- **"Invalid API key"**: Verify the key is correct in provider's dashboard
- **Rate limits**: Check your provider's usage limits and billing

#### Streaming Issues
- **Responses not appearing**: Check browser console for errors
- **Partial responses**: Try disabling streaming in Advanced Options
- **Timeout errors**: Increase timeout in provider configuration

#### History Issues
- **History not loading**: Check localStorage permissions in browser
- **Missing responses**: Ensure providers were active when requests were made
- **Search not working**: Try clearing browser cache and refreshing

### Debug Mode

Enable debug logging by:
1. Opening browser Developer Tools (F12)
2. Check the Console tab for detailed logs
3. Look for messages prefixed with provider names
4. Use the 🔍 debug button on provider cards for connection testing

### Getting Help

1. **Check the console** for error messages
2. **Test individual providers** using the connection test
3. **Try non-streaming mode** if streaming fails
4. **Verify API keys** in provider dashboards
5. **Check provider status pages** for service outages
6. **Review history page** for patterns in failed requests
7. **Use search functionality** to find similar issues in past responses

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Start development: `npm run dev`
5. Make your changes
6. Run tests: `npm run test` (if available)
7. Commit: `git commit -m 'Add amazing feature'`
8. Push: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Code Guidelines

- **TypeScript**: Use strict typing
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS classes
- **State**: Zustand for global state, useState for local
- **Errors**: Comprehensive error handling with user-friendly messages

### Adding New Providers

To add support for a new LLM provider:

1. **Add preset** in `ProviderModal.tsx`:
   ```typescript
   newprovider: {
     name: 'New Provider',
     apiUrl: 'https://api.newprovider.com',
     models: ['model-1', 'model-2'],
     requiresAuth: true,
   }
   ```

2. **Add API integration** in `api.ts`:
   ```typescript
   async function callNewProvider(provider, request, apiKey) {
     // Implementation for new provider
   }
   ```

3. **Add streaming support** in `useStreamingLLM.ts`:
   ```typescript
   if (providerName.includes('newprovider')) {
     // Provider-specific streaming logic
   }
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** for the excellent React framework
- **Tailwind CSS** for the utility-first CSS framework  
- **Zustand** for lightweight state management
- **All LLM providers** for their APIs and documentation
- **Open source community** for inspiration and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/llcomp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/llcomp/discussions)
- **Documentation**: This README and inline code comments

---

**Built with ❤️ for the AI community**

Compare. Analyze. Choose the best LLM for your needs.

*Enhanced with professional markdown rendering and comprehensive history management for the ultimate LLM comparison experience.*