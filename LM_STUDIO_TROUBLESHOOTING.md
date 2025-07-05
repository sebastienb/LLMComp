# LM Studio Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to fetch models" Error

**Possible Causes:**
- LM Studio server is not running
- Wrong port number
- CORS not enabled
- No models loaded

**Solutions:**

#### Check LM Studio Server Status
1. Open LM Studio
2. Go to **Local Server** tab
3. Make sure server is **Started** (green status)
4. Note the server address (usually `http://localhost:1234`)

#### Verify Model is Loaded
1. In LM Studio, go to **Chat** tab
2. Make sure you have selected and loaded a model
3. The model should show as "Loaded" in green

#### Enable CORS (if needed)
1. In LM Studio, go to **Local Server** tab
2. Look for CORS settings
3. Enable "Allow CORS" or similar option
4. Restart the server after enabling

#### Check Port Number
1. In LM Studio Local Server tab, verify the port
2. Common ports: `1234`, `8080`, `3000`
3. Update the API URL in the provider configuration

### 2. "Connection test failed" Error

**Possible Causes:**
- Server not accessible
- Firewall blocking connection
- Model not responding

**Solutions:**

#### Test Manual Access
1. Open your browser
2. Go to `http://localhost:1234/v1/models` (replace with your port)
3. You should see a JSON response with available models
4. If you get an error, the server isn't accessible

#### Check Firewall
1. Make sure your firewall allows connections to localhost
2. Try temporarily disabling firewall to test
3. Add LM Studio to firewall exceptions if needed

#### Restart LM Studio
1. Close LM Studio completely
2. Restart the application
3. Reload your model
4. Start the local server again

### 3. "No models found" Message

**Possible Causes:**
- No models loaded in LM Studio
- Models not properly initialized
- API endpoint returning empty response

**Solutions:**

#### Load a Model
1. In LM Studio **Chat** tab
2. Click on model dropdown
3. Select a model and wait for it to load
4. Status should show "Loaded" in green

#### Check Model Status
1. Go to **Local Server** tab
2. Verify "Model loaded" shows your selected model
3. If no model shown, go back to Chat tab and load one

#### Manual Model Entry
1. If fetch fails, you can manually enter the model name
2. Common LM Studio model names:
   - `local-model`
   - `llama-2-7b-chat`
   - Whatever name you see in the Chat tab

### 4. Slow Response or Timeouts

**Possible Causes:**
- Large model taking time to respond
- Insufficient system resources
- Network timeout

**Solutions:**

#### Adjust Timeout Settings
1. In provider configuration, increase timeout value
2. Try 60000ms (60 seconds) for large models

#### Check System Resources
1. Monitor CPU and RAM usage
2. Close other applications if needed
3. Consider using a smaller model for testing

#### Reduce Token Limits
1. Set max tokens to a lower value (e.g., 100)
2. This will make responses faster
3. Good for testing connectivity

### 5. Response Format Issues

**Possible Causes:**
- LM Studio returning unexpected response format
- Model not following chat format

**Solutions:**

#### Check LM Studio Version
1. Update to latest LM Studio version
2. Newer versions have better API compatibility

#### Try Different Model
1. Some models work better with API calls
2. Chat-tuned models generally work best
3. Try models specifically designed for chat/API use

## Step-by-Step Setup Guide

### 1. Initial Setup
1. **Download and install LM Studio**
2. **Download a model** (e.g., Llama 2 7B Chat)
3. **Load the model** in Chat tab
4. **Start Local Server** in Local Server tab

### 2. Provider Configuration
1. **Click "Add Provider"** in the comparison tool
2. **Select "LM Studio"** preset
3. **Verify URL**: Should be `http://localhost:1234` (or your port)
4. **No API key needed** - this field should be hidden
5. **Click "Fetch Models"** - should show your loaded model
6. **Select the model** from dropdown
7. **Click "Test Connection"** - should show success

### 3. Troubleshooting Checklist
- [ ] LM Studio is running
- [ ] Model is loaded and shows "Loaded" status
- [ ] Local server is started
- [ ] URL matches the server address
- [ ] Can access `http://localhost:1234/v1/models` in browser
- [ ] Firewall allows localhost connections
- [ ] No other applications using the same port

## Getting Help

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Look at LM Studio logs** for server errors
3. **Try with a different model** to isolate the issue
4. **Test with curl** to verify the API:
   ```bash
   curl http://localhost:1234/v1/models
   ```

## Common Working Configurations

### Default LM Studio Setup
- **Name**: LM Studio
- **URL**: `http://localhost:1234`
- **Model**: Whatever appears after clicking "Fetch Models"
- **Authentication**: Not required

### Alternative Port Setup
- **Name**: LM Studio Custom
- **URL**: `http://localhost:8080` (or your custom port)
- **Model**: Fetch from API or enter manually
- **Authentication**: Not required

Remember: LM Studio must be running with a loaded model and started server for the integration to work!