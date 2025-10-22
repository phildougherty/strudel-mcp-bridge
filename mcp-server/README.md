# Strudel MCP Server v2.0

A simple MCP (Model Context Protocol) server that bridges Claude Code to the Strudel browser-based live coding environment.

## Architecture

```
User → Claude Code (generates Strudel code) → MCP Server (bridge) → Browser (strudel.cc)
```

**Key Principle:** This server is a SIMPLE BRIDGE. It does NOT generate code. Claude Code generates the Strudel patterns directly by reading `STRUDEL_REFERENCE.md`.

## Features

- Simple WebSocket bridge to browser
- No AI dependencies (Claude Code handles generation)
- No API keys required
- Fast and lightweight
- Real-time code execution in browser

## Installation

```bash
npm install
npm run build
```

## Usage

### Start the Server

```bash
npm start
```

The server will:
1. Start a WebSocket server on port 3001
2. Start the MCP server on stdio
3. Wait for browser connection

### Connect Browser

1. Open [strudel.cc](https://strudel.cc) in your browser
2. Install the Strudel MCP browser extension
3. The browser will connect to the WebSocket server

### Use with Claude Code

When Claude Code wants to create Strudel patterns:

1. It reads `STRUDEL_REFERENCE.md` for Strudel API documentation
2. It generates the Strudel code directly
3. It calls `execute_pattern` MCP tool with the code
4. The server sends the code to the browser
5. The browser executes and plays the pattern

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

## File Structure

```
mcp-server/
├── src/
│   ├── server.ts              # Main MCP server (simple bridge)
│   └── websocket/
│       └── bridge-server.ts   # WebSocket server for browser communication
├── STRUDEL_REFERENCE.md       # Complete Strudel API documentation for Claude Code
├── MIGRATION_GUIDE.md         # v1.0 → v2.0 migration guide
├── package.json
└── tsconfig.json
```

## What Changed in v2.0

**v1.0 (Old - Broken):**
- MCP server had AI generation logic
- Required OpenRouter API key
- Complex pattern validation
- 1600+ lines of code

**v2.0 (New - Simple):**
- MCP server is just a bridge
- No AI dependencies
- No API keys needed
- 212 lines of code

See `MIGRATION_GUIDE.md` for complete details.

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Clean Build
```bash
rm -rf dist
npm run build
```

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

This is a simple bridge server. The goal is to keep it simple and maintainable:

1. Do NOT add AI generation logic
2. Do NOT add pattern validation
3. Do NOT add complex processing
4. Keep it as a SIMPLE BRIDGE

Code generation belongs in Claude Code, not here.

## License

MIT

## Credits

- [Strudel](https://strudel.cc) - Browser-based live coding environment
- [MCP](https://modelcontextprotocol.io) - Model Context Protocol
- [Claude Code](https://claude.com/claude-code) - AI coding assistant
