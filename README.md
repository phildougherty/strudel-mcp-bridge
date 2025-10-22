# Strudel MCP Server

Bridge Claude Code and Claude Desktop to [Strudel](https://strudel.cc), the browser-based live coding music environment.

## What is This?

This MCP server lets Claude AI assistants generate and play live-coded music directly in your browser using Strudel's powerful pattern language. Just describe what you want, and Claude will create the code and play it instantly.

## Quick Start

**1. Install dependencies:**
```bash
npm install
```

**2. Build the server:**
```bash
npm run build
```

**3. Install the MCP server:**
```bash
claude mcp add strudel node /path/to/strudel-mcp-bridge/mcp-server/dist/server.js -s user
```

**4. Open [strudel.cc](https://strudel.cc) in your browser and install the browser extension**

**5. Ask Claude to make music!**
```
"Create a dark synthwave beat with heavy bass"
"Add UK garage drums"
"Make it faster and add reverb"
```

## Architecture

```
User → Claude (generates Strudel code) → MCP Server (bridge) → Browser → 🎵
```

**Key Design:** This is a **simple bridge**. Claude generates the Strudel code, the server just forwards it to your browser.

## Features

- ✅ **No AI dependencies** - Claude generates the code itself
- ✅ **No API keys required** - Zero configuration
- ✅ **Real-time** - Instant music playback
- ✅ **Comprehensive docs** - Embedded Strudel API reference
- ✅ **Fast & lightweight** - 336 lines of code
- ✅ **Works everywhere** - Claude Code, Claude Desktop, any MCP client

## Installation

### For Development / Local Use

```bash
# Clone and install
git clone <repo-url>
cd mcp-server
npm install
npm run build
npm start
```

### For Claude Desktop

**1. Build the server:**
```bash
cd /path/to/strudel-mcp-bridge/mcp-server
npm install
npm run build
```

**2. Add to Claude Desktop config:**

Open your Claude Desktop MCP settings file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:
```json
{
  "mcpServers": {
    "strudel": {
      "command": "node",
      "args": ["/absolute/path/to/strudel-mcp-bridge/mcp-server/dist/server.js"]
    }
  }
}
```

**3. Restart Claude Desktop**

### For Browser Extension

**1. Install the extension:**
- Open Chrome/Edge and navigate to `chrome://extensions/`
- Enable "Developer mode" in the top-right corner
- Click "Load unpacked"
- Select the `browser-extension` folder from this project
- The extension should appear in your extensions list

**2. Connect to strudel.cc:**
- Open [strudel.cc](https://strudel.cc) in your browser
- The extension will automatically connect to the MCP server
- Look for a connection indicator (should turn green when connected)

**3. Start making music!**
```
"Create a jazzy beat with piano and brushed drums"
"Make a dark techno track with 808 drums"
"Add UK garage drums to this"
```

## Usage

### How It Works

1. **You ask Claude** to create music (e.g., "make a techno beat")
2. **Claude reads** the Strudel API reference (via MCP Resources)
3. **Claude generates** valid Strudel code
4. **MCP server** forwards the code to your browser via WebSocket
5. **Browser plays** the music through Strudel

### Browser Extension

The browser extension bridges the MCP server to strudel.cc:

- Connects to WebSocket server at `ws://localhost:3001`
- Injects code execution capabilities into Strudel
- Provides visual connection status indicator
- See installation instructions in the "Installation" section above

### Example Session

```
You: "Create a house beat with 808 drums"
Claude: [reads strudel://reference resource]
Claude: [generates Strudel code]
Claude: [calls execute_pattern]
Browser: 🎵 Music plays!

You: "Add a deep bass line"
Claude: [modifies the code]
Claude: [calls execute_pattern]
Browser: 🎵 Updated music plays!
```

## MCP Resources

### strudel://reference

The complete Strudel API reference is exposed as an MCP Resource. This allows Claude Code and Claude Desktop to automatically access the documentation without needing file system access.

**Resource Details:**
- **URI:** `strudel://reference`
- **Name:** Strudel API Reference
- **MIME Type:** `text/markdown`
- **Description:** Complete Strudel live coding API reference with syntax, sounds, effects, and examples

**Usage:**
MCP clients can fetch this resource at session start to provide the LLM with complete Strudel API knowledge. The documentation is embedded directly in the compiled server, making it fully portable even when installed via npm globally.

**How to Fetch:**
```json
{
  "method": "resources/read",
  "params": {
    "uri": "strudel://reference"
  }
}
```

The resource returns the complete markdown documentation including:
- Mini-notation syntax and operators
- 300+ sound sources (drums, synths, GM instruments, samples)
- 70+ audio effects with parameters
- Pattern structure and factories
- Time modifiers and transformations
- Style templates with examples
- Critical rules and best practices

## MCP Tools

### execute_pattern

Execute raw Strudel code in the connected browser.

**Parameters:**
- `code` (string): Raw Strudel code to execute

**Example:**
```javascript
execute_pattern({
  code: `setcps(0.5)
stack(
  s("bd*4, ~ sd ~ sd, hh*8").bank("tr808"),
  note("c2*8").s("sawtooth").lpf(300)
)`
});
```

### stop_pattern

Stop all currently playing patterns.

**Parameters:** None

### get_connection_status

Check if browser is connected and ready.

**Parameters:** None

**Returns:** Connection status information

## Project Structure

```
strudel-mcp-bridge/
├── mcp-server/                # MCP server (bridge to browser)
│   ├── src/
│   │   ├── server.ts          # Main MCP server
│   │   └── websocket/
│   │       └── bridge-server.ts  # WebSocket communication
│   ├── STRUDEL_REFERENCE.md   # Strudel API docs (embedded in server)
│   ├── MIGRATION_GUIDE.md     # v1.0 → v2.0 migration guide
│   └── package.json
├── browser-extension/         # Chrome extension (connects strudel.cc)
│   ├── manifest.json
│   ├── content-script.js
│   ├── background.js
│   └── popup.html
└── README.md                  # This file
```

## Why This Architecture?

**Simple Bridge = Reliable:**
- Claude generates the code (it's good at this!)
- Server just forwards it (keeps it simple)
- No double-AI translation issues
- No API keys or configuration needed

**Previous version had AI-in-server** which caused:
- Double AI calls (slow, expensive)
- Pattern complexity loss in translation
- API key requirements
- 1600+ lines of fragile validation code

**Current version: Direct execution** = Fast, reliable, simple.

See `MIGRATION_GUIDE.md` if upgrading from v1.0.

## Development

### MCP Server Development

```bash
cd mcp-server

# Install dependencies
npm install

# Build
npm run build

# Development mode with watch
npm run dev

# Clean build
rm -rf dist
npm run build
```

### Browser Extension Development

```bash
cd browser-extension

# No build step needed - just load the extension in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the browser-extension folder
```

### Testing the Full Stack

1. **Start MCP server** (via Claude Desktop or manually)
2. **Install browser extension** (developer mode)
3. **Open strudel.cc**
4. **Check connection status** (indicator should be green)
5. **Ask Claude** to create music
6. **Verify** pattern plays in browser

## Strudel Reference

The complete Strudel API documentation is available in two ways:

1. **MCP Resource** (Recommended): Access via `strudel://reference` resource - no file system access needed
2. **File**: Read `STRUDEL_REFERENCE.md` if you have file system access

The documentation includes:

- Mini-notation syntax
- 300+ sound sources (drums, synths, instruments, samples)
- 70+ audio effects
- Pattern factories and time modifiers
- Style templates and examples
- Critical rules and best practices

## Troubleshooting

### No Browser Connected

**Symptoms:** `execute_pattern` returns "No browser connected"

**Solutions:**
1. Open strudel.cc in your browser
2. Install the browser extension
3. Check that WebSocket server is running on port 3001
4. Use `get_connection_status` to verify

### Invalid Strudel Code

**Symptoms:** Pattern doesn't play or errors in browser

**Solutions:**
1. Ensure code starts with `setcps(NUMBER)`
2. Check all sound names are valid (see STRUDEL_REFERENCE.md)
3. Validate mini-notation syntax
4. Check for balanced brackets and quotes

### Build Errors

**Solutions:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Architecture Details

### WebSocket Protocol

**Server → Browser:**
```json
{
  "type": "execute_code",
  "code": "setcps(0.5)\\nstack(...)"
}
```

```json
{
  "type": "stop_all"
}
```

**Browser → Server:**
```json
{
  "type": "execution_result",
  "data": { "success": true }
}
```

```json
{
  "type": "browser_ready"
}
```

### MCP Protocol

Standard MCP protocol via stdio:
- `tools/list` - List available tools
- `tools/call` - Execute a tool

## Contributing

**Keep It Simple!** This server should remain a simple bridge.

**Do NOT add:**
- ❌ AI generation logic (Claude does this)
- ❌ Pattern validation (adds complexity)
- ❌ Code transformation (fragile)
- ❌ API dependencies (increases setup friction)

**Do add:**
- ✅ Better WebSocket reliability
- ✅ Improved error messages
- ✅ Additional MCP resources (if useful)
- ✅ Documentation improvements

**Philosophy:** The intelligence is in Claude, not in this server.

## FAQ

**Q: Do I need an API key?**
A: No! Zero configuration required.

**Q: Can I use this with other LLMs besides Claude?**
A: Yes! Any MCP-compatible AI can use this server. They'll need to read the `strudel://reference` resource and generate valid Strudel code.

**Q: Does this work offline?**
A: The MCP server works offline, but you need internet to access strudel.cc in your browser.

**Q: Can I use a different port?**
A: Currently hardcoded to 3001. Open an issue if you need this configurable.

**Q: Does the browser extension work with Firefox/Safari?**
A: Currently Chrome/Edge only (Manifest V3). Firefox support planned.

**Q: Can I publish patterns to share with others?**
A: Yes! Strudel has built-in sharing features. The patterns are just Strudel code.

**Q: What if I want to use a different live coding environment?**
A: The architecture is extensible - you could create a bridge to other environments like TidalCycles, Sonic Pi, etc.

## License

MIT

## Credits

- [Strudel](https://strudel.cc) - Alex McLean, Felix Roos, and contributors
- [MCP](https://modelcontextprotocol.io) - Anthropic
- Built with ❤️ for live coding music
