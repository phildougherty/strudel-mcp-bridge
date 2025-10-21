#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool 
} from '@modelcontextprotocol/sdk/types.js';
import { PatternGenerator } from './tools/pattern-generator.js';
import { BridgeServer } from './websocket/bridge-server.js';
import * as dotenv from 'dotenv';

dotenv.config();

class StrudelMCPServer {
  private server: Server;
  private patternGenerator: PatternGenerator;
  private bridgeServer: BridgeServer;

  constructor() {
    this.server = new Server(
      { name: 'strudel-mcp-server', version: '1.0.0' }
    );
    
    // Initialize with OpenRouter settings
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      process.exit(1);
    }
    
    try {
      this.patternGenerator = new PatternGenerator(apiKey, model, baseUrl);
    } catch (error) {
      console.error('Failed to initialize PatternGenerator:', error);
      process.exit(1);
    }
    
    this.bridgeServer = new BridgeServer();
    
    this.setupHandlers();
    
    // Log configuration to stderr so it doesn't interfere with MCP protocol
    console.error('AI Configuration:');
    console.error(`  Model: ${this.patternGenerator.getModel()}`);
    console.error(`  API: ${baseUrl}`);
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.getTools() };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'create_live_pattern':
            return await this.handleCreatePattern(args);
          case 'modify_live_pattern':
            return await this.handleModifyPattern(args);
          case 'stop_pattern':
            return await this.handleStopPattern();
          case 'get_connection_status':
            return await this.handleConnectionStatus();
          case 'set_ai_model':
            return await this.handleSetAIModel(args);
          case 'get_ai_info':
            return await this.handleGetAIInfo();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'create_live_pattern',
        description: 'Create and immediately play a Strudel pattern in the connected browser',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Natural language description of the pattern to create'
            },
            style: {
              type: 'string',
              description: 'Musical style (jazz, electronic, ambient, etc.)',
              default: 'general'
            },
            tempo: {
              type: 'number',
              description: 'Tempo in BPM (optional)',
              minimum: 60,
              maximum: 200
            }
          },
          required: ['description']
        }
      },
      {
        name: 'modify_live_pattern',
        description: 'Modify the currently playing pattern',
        inputSchema: {
          type: 'object',
          properties: {
            modification: {
              type: 'string',
              description: 'Description of how to modify the current pattern'
            }
          },
          required: ['modification']
        }
      },
      {
        name: 'stop_pattern',
        description: 'Stop all currently playing patterns',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_connection_status',
        description: 'Check if browser is connected and ready',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'set_ai_model',
        description: 'Change the AI model used for pattern generation',
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'OpenRouter model name (e.g., anthropic/claude-3-5-sonnet-20241022, openai/gpt-4, etc.)'
            }
          },
          required: ['model']
        }
      },
      {
        name: 'get_ai_info',
        description: 'Get information about the current AI model and configuration',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  private async handleCreatePattern(args: any) {
    const { description, style = 'general', tempo } = args;
    
    if (!this.bridgeServer.hasConnectedClients()) {
      return {
        content: [
          {
            type: 'text',
            text: 'No browser connected. Please open strudel.cc and install/enable the browser extension.'
          }
        ]
      };
    }

    try {
      console.error(`Generating pattern: "${description}" (${style})`);
      const code = await this.patternGenerator.generatePattern(description, style, tempo);
      
      // Send to browser
      this.bridgeServer.sendToBrowser({
        type: 'execute_code',
        code: code,
        comment: `// Generated: ${description}`
      });

      return {
        content: [
          {
            type: 'text',
            text: `Created pattern: ${description}\n\nGenerated Strudel code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nThe pattern should now be playing in your browser!`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to generate pattern: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }


  private async handleModifyPattern(args: any) {
    const { modification } = args;
    
    if (!this.bridgeServer.hasConnectedClients()) {
      return {
        content: [
          {
            type: 'text',
            text: 'No browser connected. Please open strudel.cc and install/enable the browser extension.'
          }
        ]
      };
    }

    try {
      console.error(`Modifying pattern: "${modification}"`);
      // Get current pattern from browser
      const currentCode = await this.bridgeServer.getCurrentCode();
      
      // Generate modified pattern
      const newCode = await this.patternGenerator.modifyPattern(currentCode, modification);
      
      // Send to browser
      this.bridgeServer.sendToBrowser({
        type: 'execute_code',
        code: newCode,
        comment: `// Modified: ${modification}`
      });

      return {
        content: [
          {
            type: 'text',
            text: `Modified pattern: ${modification}\n\nUpdated Strudel code:\n\`\`\`javascript\n${newCode}\n\`\`\`\n\nThe modified pattern should now be playing!`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to modify pattern: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleStopPattern() {
    if (!this.bridgeServer.hasConnectedClients()) {
      return {
        content: [
          {
            type: 'text',
            text: 'No browser connected.'
          }
        ]
      };
    }

    this.bridgeServer.sendToBrowser({
      type: 'stop_all'
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Stopped all playing patterns.'
        }
      ]
    };
  }

  private async handleConnectionStatus() {
    const connected = this.bridgeServer.hasConnectedClients();
    const clientCount = this.bridgeServer.getClientCount();
    
    return {
      content: [
        {
          type: 'text',
          text: `Connection Status:\n- Browser connected: ${connected ? 'Yes' : 'No'}\n- Active connections: ${clientCount}\n- WebSocket server: Running on port 3001\n- AI Model: ${this.patternGenerator.getModel()}\n\n${connected ? 'Ready to create music!' : 'Please open strudel.cc and enable the browser extension.'}`
        }
      ]
    };
  }

  private async handleSetAIModel(args: any) {
    const { model } = args;
    
    try {
      this.patternGenerator.setModel(model);
      console.error(`Switched to model: ${model}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully switched to model: ${model}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to set model: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleGetAIInfo() {
    return {
      content: [
        {
          type: 'text',
          text: `AI Configuration:\n- Current Model: ${this.patternGenerator.getModel()}\n- API Provider: OpenRouter\n- Base URL: https://openrouter.ai/api/v1\n\nPopular models:\n- anthropic/claude-3-5-sonnet-20241022 (default)\n- openai/gpt-4-turbo-preview\n- openai/gpt-3.5-turbo\n- meta-llama/llama-3.1-8b-instruct\n- google/gemma-2-9b-it`
        }
      ]
    };
  }

  async start() {
    // Start WebSocket server
    await this.bridgeServer.start();
    console.error('Strudel MCP Bridge Server started');
    console.error('WebSocket server running on port 3001');
    console.error('Open strudel.cc and install the browser extension to connect');
    
    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start server
const server = new StrudelMCPServer();
server.start().catch(console.error);
