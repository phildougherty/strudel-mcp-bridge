# Strudel MCP Bridge

A Model Context Protocol server that enables AI assistants to create music using Strudel live coding patterns. This bridge allows Claude Desktop and other MCP-compatible AI assistants to generate, execute, and modify Strudel patterns in real-time through your browser.

## Features

- Real-time Strudel pattern generation from natural language descriptions
- Live pattern modification and iteration
- Browser integration with visual feedback
- Support for 2000+ Strudel sounds and drum machines
- WebSocket-based communication for immediate audio playback
- Comprehensive pattern validation and error handling

## Architecture

```
Claude Desktop / Claude Code → MCP Server → WebSocket → Browser Extension → Strudel.cc
```

The system consists of three components:
1. **MCP Server**: TypeScript server that interfaces with AI models (works with Claude Desktop or Claude Code CLI)
2. **Browser Extension**: Chrome extension that communicates with Strudel
3. **Strudel Integration**: Real-time pattern execution in the browser

## Installation

### 1. MCP Server Setup

Clone and build the TypeScript server:

```bash
git clone <repository-url>
cd strudel-mcp-bridge/mcp-server
npm install
npm run build
```

Create environment configuration:

```bash
cp .env.example .env
# Edit .env with your API credentials
```

Required environment variables:

```
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=anthropic/claude-3-5-sonnet-20241022
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Get an API key from [OpenRouter.ai](https://openrouter.ai) and add credits to your account.

### 2. Claude Desktop Configuration

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "strudel-mcp-bridge": {
      "command": "node",
      "args": ["dist/server.js"],
      "cwd": "/absolute/path/to/strudel-mcp-bridge/mcp-server",
      "env": {
        "OPENROUTER_API_KEY": "your-openrouter-api-key-here",
        "OPENROUTER_MODEL": "anthropic/claude-3-5-sonnet-20241022"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/strudel-mcp-bridge/mcp-server` with your actual full path.

Restart Claude Desktop completely after making changes.

### 3. Claude Code CLI Configuration

If you're using [Claude Code](https://claude.com/claude-code), the CLI tool for Claude, setup is even simpler:

```bash
cd strudel-mcp-bridge/mcp-server
npm install
npm run build

# Add the MCP server to Claude Code
claude mcp add strudel node $(pwd)/dist/server.js
```

Make sure your `.env` file is configured with your OpenRouter API key before starting.

To verify the connection:
1. Start Claude Code: `claude`
2. Check MCP status: `/mcp`
3. You should see "strudel" listed as a connected server

The MCP server will automatically start when you launch Claude Code and will be available for all your sessions.

### 4. Browser Extension Installation

#### Development Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `browser-extension` folder
4. The extension should appear in your extensions list

#### Verify Installation

1. Go to [strudel.cc](https://strudel.cc)
2. Look for a connection indicator (colored circle) in the top-right corner of the page
3. The indicator should change from red to green when connected

## Usage

### Basic Usage

1. **Start the system**:
   - Open Claude Desktop
   - Open strudel.cc in Chrome
   - Verify the connection indicator shows green

2. **Create patterns**:
   ```
   Create a house beat with kick on every beat and hi-hats
   ```

3. **Modify patterns**:
   ```
   Add a bassline to the current pattern
   Make it faster
   Add reverb
   ```

4. **Stop playback**:
   ```
   Stop the current pattern
   ```

### Available Commands

The system provides several MCP tools:

- `create_live_pattern`: Generate and play new Strudel patterns
- `modify_live_pattern`: Modify the currently playing pattern
- `stop_pattern`: Stop all audio playback
- `get_connection_status`: Check browser connection status
- `set_ai_model`: Change the AI model used for generation
- `get_ai_info`: Display current AI configuration

## Debugging

### Browser Extension Debugging

1. **Open Developer Tools**:
   - Go to strudel.cc
   - Press F12 to open DevTools
   - Check the Console tab for messages

2. **Extension Console**:
   ```javascript
   // Check bridge status
   console.log(window.strudelMCPBridge);
   
   // Debug connection
   debugStrudel();
   
   // Manual connection test
   const testWS = new WebSocket('ws://localhost:3001');
   testWS.onopen = () => console.log('WebSocket connected');
   testWS.onerror = (e) => console.log('WebSocket error:', e);
   ```

3. **Connection Indicator**:
   - Red circle: Disconnected or error
   - Orange circle: Connecting
   - Green circle: Connected and ready
   - Click the circle for detailed status information

### Common Issues

1. **WebSocket Connection Failed**:
   - Verify Claude Desktop is running
   - Check that the MCP server started successfully
   - Ensure port 3001 is not blocked by firewall

2. **Audio Not Playing**:
   - Click anywhere on the strudel.cc page to enable audio
   - Check browser audio permissions
   - Verify Strudel loaded completely

3. **Invalid Patterns**:
   - The AI may generate non-existent sound names
   - Syntax errors are automatically corrected when possible
   - Check the browser console for specific Strudel errors

### MCP Server Debugging

Monitor server logs in Claude Desktop:
- Successful connection: Look for "WebSocket server listening on port 3001"
- Pattern generation: Check for OpenRouter API calls
- Browser communication: Monitor WebSocket message logs

## Limitations and Known Issues

### AI Hallucinations

The AI model may occasionally:

1. **Generate invalid sound names** (e.g., "bass", "synth", "lead")
   - The system automatically replaces these with valid alternatives
   - Valid sounds include: bd, sd, hh, cp, piano, sawtooth, sine, gm_acoustic_bass

2. **Use incorrect Strudel syntax**:
   - `.compress()` with wrong parameters
   - Malformed mini-notation strings
   - Missing quotes or brackets

3. **Create overly complex patterns** that may not sound musical

### Syntax Validation

The system includes automatic validation and correction:
- Fixes unterminated strings
- Replaces invalid sound names
- Adds missing `setcps()` commands
- Removes problematic functions

### Browser Compatibility

- Requires modern Chrome, Firefox, Safari, or Edge
- WebSocket connections must be allowed
- Audio autoplay must be permitted after user interaction

## Development

### Project Structure

```
strudel-mcp-bridge/
├── mcp-server/
│   ├── src/
│   │   ├── server.ts              # Main MCP server
│   │   ├── tools/
│   │   │   └── pattern-generator.ts  # AI pattern generation
│   │   └── websocket/
│   │       └── bridge-server.ts   # WebSocket communication
│   ├── package.json
│   └── tsconfig.json
├── browser-extension/
│   ├── manifest.json              # Extension configuration
│   ├── content-script.js          # Strudel integration
│   ├── background.js              # Extension service worker
│   └── popup.html                 # Extension popup UI
└── README.md
```

### Building from Source

```bash
# MCP Server
cd mcp-server
npm install
npm run build
npm start  # For testing only

# Browser Extension
# Load unpacked extension in Chrome developer mode
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Claude Desktop and browser extension
5. Submit a pull request

## Troubleshooting

### Connection Issues

Check the connection status with:
```
get_connection_status
```

### Audio Permissions

If audio doesn't play:
1. Click anywhere on the strudel.cc page
2. Look for browser audio permission prompts
3. Check browser audio settings

### Pattern Generation Issues

If patterns don't sound right:
- Patterns may use non-existent instruments
- The system provides fallback patterns for reliability
- Try simpler descriptions for better results

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the browser console for error messages
2. Verify all components are properly connected
3. Review Claude Desktop MCP configuration
4. Test with simple pattern descriptions first
