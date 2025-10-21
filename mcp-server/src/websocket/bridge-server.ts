import { WebSocketServer, WebSocket } from 'ws';

interface BridgeMessage {
    type: string;
    code?: string;
    comment?: string;
    data?: any;
    requestId?: string;
}

export class BridgeServer {
    private wss: WebSocketServer;
    private clients: Set<WebSocket> = new Set();
    private pendingCodeRequests: Map<string, (code: string) => void> = new Map();

    constructor(port: number = 3001) {
        this.wss = new WebSocketServer({ port });
    }

    async start(): Promise<void> {
        this.wss.on('connection', (ws: WebSocket, req) => {
            console.error('Browser connected from:', req.headers.origin);
            this.clients.add(ws);

            ws.on('message', (data: Buffer) => {
                try {
                    const message = JSON.parse(data.toString()) as BridgeMessage;
                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            });

            ws.on('close', () => {
                console.error('Browser disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });

            this.sendToClient(ws, {
                type: 'connected',
                data: { message: 'Connected to Strudel MCP Bridge' }
            });
        });

        return new Promise((resolve) => {
            this.wss.on('listening', () => {
                console.error(`WebSocket server listening on port 3001`);
                resolve();
            });
        });
    }

    private handleMessage(ws: WebSocket, message: BridgeMessage) {
        switch (message.type) {
            case 'browser_ready':
                console.error('Browser ready for patterns');
                break;
            case 'execution_result':
                console.error('Pattern execution:', message.data?.success ? 'success' : 'failed');
                break;
            case 'current_code':
                if (message.requestId && this.pendingCodeRequests.has(message.requestId)) {
                    const resolve = this.pendingCodeRequests.get(message.requestId)!;
                    this.pendingCodeRequests.delete(message.requestId);
                    resolve(message.code || '');
                }
                break;
            case 'error':
                console.error('Browser error:', message.data?.error);
                break;
        }
    }

    async getCurrentCode(): Promise<string> {
        if (!this.hasConnectedClients()) {
            return '';
        }

        return new Promise((resolve) => {
            const requestId = Math.random().toString(36).substr(2, 9);
            
            this.pendingCodeRequests.set(requestId, resolve);
            
            this.sendToBrowser({
                type: 'get_current_code',
                requestId: requestId
            });

            setTimeout(() => {
                if (this.pendingCodeRequests.has(requestId)) {
                    this.pendingCodeRequests.delete(requestId);
                    resolve('');
                }
            }, 5000);
        });
    }

    sendToBrowser(message: BridgeMessage) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    private sendToClient(client: WebSocket, message: BridgeMessage) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    }

    hasConnectedClients(): boolean {
        return this.clients.size > 0;
    }

    getClientCount(): number {
        return this.clients.size;
    }
}
