(function() {
    'use strict';

    console.log('🎵 Strudel MCP Bridge v1.0: Content script loaded on', window.location.href);

    if (!window.location.href.includes('strudel.cc') && !window.location.href.includes('localhost:3000')) {
        console.log('❌ Not on a Strudel page, exiting');
        return;
    }

    class StrudelMCPBridge {
        constructor() {
            this.ws = null;
            this.connected = false;
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 10;
            this.editor = null;
            this.reconnectDelay = 1000;
            this.strudelDetected = false;
            this.audioPermissionGranted = false;
            this.version = '1.0.0';
            this.audioContext = null;
            this.audioInitialized = false;
            this.executionQueue = [];
            this.isExecuting = false;
            this.init();
        }

        async init() {
            console.log('🎵 Initializing Strudel MCP Bridge...');
            this.addConnectionIndicator();
            this.updateConnectionStatus('waiting');
            this.setupAudioPermissionDetection();
            await this.waitForStrudel();
            this.findEditor();
            this.setupHealthChecks();
            this.connectWithRetry();
        }

        setupAudioPermissionDetection() {
            const enableAudio = async () => {
                if (!this.audioPermissionGranted) {
                    await this.initializeAudio();
                }
            };

            ['click', 'keydown', 'touchstart'].forEach(event => {
                document.addEventListener(event, enableAudio, { once: true });
            });
        }

        async initializeAudio() {
            try {
                this.audioContext = window.audioContext || 
                                  window.strudelAudioContext ||
                                  window.webkitAudioContext ||
                                  (window.AudioContext && new AudioContext()) ||
                                  (window.webkitAudioContext && new webkitAudioContext());

                if (this.audioContext) {
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                    }
                    this.audioPermissionGranted = true;
                    this.audioInitialized = true;
                    console.log('✅ Audio context initialized successfully');
                    this.updateConnectionStatus(this.connected ? 'connected' : 'detected');
                }
            } catch (error) {
                console.warn('⚠️ Audio initialization failed:', error);
            }
        }

        async waitForStrudel() {
            return new Promise((resolve) => {
                let attempts = 0;
                const maxAttempts = 30;
                
                const checkStrudel = () => {
                    attempts++;
                    console.log(`⏳ Checking for Strudel... (attempt ${attempts})`);
                    
                    const indicators = {
                        cmEditor: document.querySelector('.cm-editor'),
                        cmContent: document.querySelector('.cm-content'),
                        strudelElements: document.querySelectorAll('[class*="strudel"], [id*="strudel"]'),
                        pageTitle: document.title.toLowerCase().includes('strudel'),
                        strudelInDOM: document.body.textContent.toLowerCase().includes('strudel'),
                        buttons: document.querySelectorAll('button'),
                        reactRoot: document.querySelector('#root, [data-reactroot]'),
                        scripts: document.querySelectorAll('script[src*="strudel"], script[src*="tidal"]')
                    };

                    const hasEditor = indicators.cmEditor && indicators.cmContent;
                    const isStrudelSite = indicators.pageTitle || indicators.strudelInDOM;
                    const hasInterface = indicators.buttons.length > 0 && indicators.reactRoot;
                    const hasStrudelAssets = indicators.scripts.length > 0 || indicators.strudelElements.length > 0;
                    const detected = hasEditor && isStrudelSite && (hasInterface || hasStrudelAssets);

                    if (detected) {
                        console.log('✅ Strudel detected and ready!');
                        this.strudelDetected = true;
                        this.updateConnectionStatus('detected');
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        console.log('⚠️ Timeout waiting for full Strudel load, proceeding with basic detection');
                        if (hasEditor && window.location.href.includes('strudel.cc')) {
                            this.strudelDetected = true;
                            this.updateConnectionStatus('detected');
                        } else {
                            this.updateConnectionStatus('timeout');
                        }
                        resolve();
                    } else {
                        setTimeout(checkStrudel, 1000);
                    }
                };
                checkStrudel();
            });
        }

        findEditor() {
            const selectors = [
                '.cm-editor',
                '.CodeMirror',
                '[data-language="javascript"]',
                '[contenteditable="true"]',
                'textarea[data-mode="javascript"]',
                '.monaco-editor',
                'textarea'
            ];

            for (const selector of selectors) {
                this.editor = document.querySelector(selector);
                if (this.editor) {
                    console.log('✅ Found editor with selector:', selector);
                    break;
                }
            }

            if (!this.editor) {
                console.warn('⚠️ No editor found initially, will retry later');
            }
        }

        setupHealthChecks() {
            setInterval(() => {
                if (this.connected) {
                    this.send({ type: 'health_check', timestamp: Date.now() });
                }
                
                if (!this.editor) {
                    this.findEditor();
                }
            }, 30000);
        }

        connectWithRetry() {
            this.connect();
        }

        connect() {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('❌ Max reconnection attempts reached');
                this.updateConnectionStatus('error');
                return;
            }

            try {
                console.log(`🔌 Connecting to MCP server... (attempt ${this.reconnectAttempts + 1})`);
                this.updateConnectionStatus('connecting');
                this.ws = new WebSocket('ws://localhost:3001');

                this.ws.onopen = () => {
                    console.log('✅ Connected to MCP server');
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    this.updateConnectionStatus('connected');
                    
                    this.send({
                        type: 'browser_ready',
                        data: { 
                            url: window.location.href,
                            userAgent: navigator.userAgent,
                            timestamp: Date.now(),
                            strudelDetected: this.strudelDetected,
                            hasEditor: !!this.editor,
                            editorType: this.editor ? this.editor.className : 'none',
                            audioPermissionGranted: this.audioPermissionGranted,
                            audioInitialized: this.audioInitialized,
                            version: this.version
                        }
                    });
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log('📨 Received message:', message.type);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Failed to parse message:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 Disconnected from MCP server. Code:', event.code, 'Reason:', event.reason);
                    this.connected = false;
                    this.updateConnectionStatus('disconnected');
                    this.scheduleReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.updateConnectionStatus('error');
                };

                setTimeout(() => {
                    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                        console.log('⏰ Connection timeout');
                        this.ws.close();
                    }
                }, 5000);

            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                this.updateConnectionStatus('error');
                this.scheduleReconnect();
            }
        }

        scheduleReconnect() {
            this.reconnectAttempts++;
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 10000);
                console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
                setTimeout(() => this.connect(), delay);
            }
        }

        handleMessage(message) {
            switch (message.type) {
                case 'execute_code':
                    this.queueExecution(message.code, message.comment);
                    break;
                case 'stop_all':
                    this.stopAll();
                    break;
                case 'get_current_code':
                    this.sendCurrentCode(message.requestId);
                    break;
                case 'connected':
                    console.log('✅ Bridge connection confirmed');
                    break;
                case 'health_check':
                    this.send({ type: 'health_response', status: 'ok' });
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        }

        sendCurrentCode(requestId) {
            let code = '';
            if (this.editor) {
                const methods = [
                    () => {
                        const cmView = this.editor.cmView || window.cm || window.editor;
                        return cmView && cmView.state ? cmView.state.doc.toString() : null;
                    },
                    () => {
                        const cmContent = this.editor.querySelector('.cm-content');
                        return cmContent ? cmContent.textContent : null;
                    },
                    () => {
                        return this.editor.CodeMirror ? this.editor.CodeMirror.getValue() : null;
                    },
                    () => {
                        const textarea = this.editor.querySelector('textarea') || this.editor;
                        return textarea && textarea.value !== undefined ? textarea.value : null;
                    }
                ];

                for (const method of methods) {
                    try {
                        const result = method();
                        if (result !== null) {
                            code = result;
                            break;
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }

            console.log('📤 Sending current code:', code.length, 'characters');
            this.send({
                type: 'current_code',
                code: code,
                requestId: requestId
            });
        }

        queueExecution(code, comment) {
            this.executionQueue.push({ code, comment, timestamp: Date.now() });
            this.processExecutionQueue();
        }

        async processExecutionQueue() {
            if (this.isExecuting || this.executionQueue.length === 0) {
                return;
            }

            this.isExecuting = true;
            while (this.executionQueue.length > 0) {
                const { code, comment } = this.executionQueue.shift();
                await this.executeCode(code, comment);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            this.isExecuting = false;
        }

        async executeCode(code, comment) {
            try {
                console.log('🎵 Executing code in editor');
                console.log('Code to execute:', code);
                
                if (!this.audioPermissionGranted) {
                    await this.ensureAudioPermission();
                }
                
                if (!this.editor) {
                    this.findEditor();
                }
                
                if (!this.editor) {
                    throw new Error('No editor found');
                }
                
                const codeWithComment = comment ? `${comment}\n${code}` : code;
                
                await this.updateEditor(codeWithComment);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.evaluateCode(codeWithComment);
                
                this.send({
                    type: 'execution_result',
                    data: { 
                        success: true, 
                        timestamp: Date.now(),
                        audioPermissionGranted: this.audioPermissionGranted 
                    }
                });
                
            } catch (error) {
                console.error('Failed to execute code:', error);
                this.send({
                    type: 'execution_result',
                    data: { 
                        success: false, 
                        error: error.message,
                        audioPermissionGranted: this.audioPermissionGranted 
                    }
                });
            }
        }

        async ensureAudioPermission() {
            if (this.audioPermissionGranted) {
                return;
            }

            try {
                console.log('🔊 Attempting to enable audio permission...');
                document.body.click();
                document.body.focus();
                
                await this.initializeAudio();
                
                if (!this.audioPermissionGranted) {
                    this.showAudioPermissionMessage();
                }
            } catch (error) {
                console.warn('Audio permission setup failed:', error);
                this.showAudioPermissionMessage();
            }
        }

        showAudioPermissionMessage() {
            const existing = document.getElementById('strudel-audio-notification');
            if (existing) {
                existing.remove();
            }

            const notification = document.createElement('div');
            notification.id = 'strudel-audio-notification';
            notification.style.cssText = `
                position: fixed;
                top: 60px;
                right: 10px;
                background: linear-gradient(135deg, #ff6b00, #ff8c00);
                color: white;
                padding: 16px;
                border-radius: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                z-index: 10001;
                max-width: 280px;
                box-shadow: 0 6px 16px rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.2);
                backdrop-filter: blur(10px);
                cursor: pointer;
                transition: transform 0.2s ease;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 18px; margin-right: 8px;">🔊</span>
                    <strong>Audio Permission Needed</strong>
                </div>
                <div style="font-size: 13px; opacity: 0.9; line-height: 1.4;">
                    Click anywhere on this page to enable audio, then the pattern will play automatically.
                </div>
                <div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">
                    Click this message to dismiss
                </div>
            `;

            notification.addEventListener('mouseenter', () => {
                notification.style.transform = 'translateY(-2px)';
            });
            notification.addEventListener('mouseleave', () => {
                notification.style.transform = 'translateY(0)';
            });

            document.body.appendChild(notification);

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 8000);

            notification.addEventListener('click', () => {
                notification.remove();
            });

            const removeOnAudioPermission = () => {
                if (this.audioPermissionGranted && notification.parentNode) {
                    notification.remove();
                    document.removeEventListener('click', removeOnAudioPermission);
                }
            };
            document.addEventListener('click', removeOnAudioPermission);
        }

        async updateEditor(code) {
            if (!this.editor) {
                this.findEditor();
            }
            
            if (!this.editor) {
                throw new Error('Editor not found');
            }

            console.log('📝 Updating editor with new code');

            const methods = [
                () => {
                    const cmView = this.editor.cmView || window.cm || window.editor;
                    if (cmView && cmView.dispatch) {
                        console.log('📝 Using CodeMirror 6 view.dispatch');
                        cmView.dispatch({
                            changes: {
                                from: 0,
                                to: cmView.state.doc.length,
                                insert: code
                            }
                        });
                        return true;
                    }
                    return false;
                },
                () => {
                    const cmContent = this.editor.querySelector('.cm-content');
                    if (cmContent) {
                        console.log('📝 Updating .cm-content directly');
                        cmContent.textContent = code;
                        const events = ['input', 'change', 'keyup'];
                        events.forEach(eventName => {
                            cmContent.dispatchEvent(new Event(eventName, { bubbles: true }));
                        });
                        return true;
                    }
                    return false;
                },
                () => {
                    console.log('📝 Using focus and selection replacement');
                    this.editor.click();
                    this.editor.focus();
                    if (document.execCommand) {
                        document.execCommand('selectAll');
                        document.execCommand('insertText', false, code);
                        return true;
                    }
                    return false;
                },
                () => {
                    if (this.editor.CodeMirror) {
                        console.log('📝 Using CodeMirror 5');
                        this.editor.CodeMirror.setValue(code);
                        return true;
                    }
                    return false;
                },
                () => {
                    const textarea = this.editor.querySelector('textarea') || this.editor;
                    if (textarea && textarea.value !== undefined) {
                        console.log('📝 Using textarea fallback');
                        textarea.value = code;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                    return false;
                }
            ];

            for (const method of methods) {
                try {
                    if (method()) {
                        console.log('✅ Editor updated successfully');
                        return;
                    }
                } catch (error) {
                    console.log('Method failed:', error);
                    continue;
                }
            }
            
            throw new Error('Could not update editor with any method');
        }

        async evaluateCode(code) {
            console.log('▶️ Attempting to evaluate code');
            
            if (!this.audioPermissionGranted) {
                await this.ensureAudioPermission();
            }

            const evaluationMethods = [
                () => {
                    const functions = ['evalCode', 'evaluate', 'playPattern', 'runCode'];
                    for (const funcName of functions) {
                        if (window[funcName] && typeof window[funcName] === 'function') {
                            console.log('🎯 Using global function:', funcName);
                            window[funcName](code);
                            return true;
                        }
                    }
                    return false;
                },
                () => {
                    const buttonSelectors = [
                        'button[title*="play"]',
                        'button[aria-label*="play"]', 
                        'button[title*="eval"]',
                        'button[aria-label*="eval"]',
                        'button:has(svg[data-icon*="play"])',
                        'button:has([data-icon*="play"])',
                        '.play-button',
                        '.eval-button'
                    ];
                    
                    for (const selector of buttonSelectors) {
                        try {
                            const button = document.querySelector(selector);
                            if (button && !button.disabled) {
                                console.log('▶️ Clicking button with selector:', selector);
                                button.click();
                                return true;
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                    return false;
                },
                () => {
                    console.log('⌨️ Trying keyboard shortcuts');
                    if (this.editor) {
                        this.editor.click();
                        this.editor.focus();
                    }
                    
                    const shortcuts = [
                        { key: 'Enter', ctrlKey: true },
                        { key: 'Enter', shiftKey: true },
                        { key: 'Enter', metaKey: true },
                        { key: 'r', ctrlKey: true }
                    ];
                    
                    for (const shortcut of shortcuts) {
                        try {
                            document.dispatchEvent(new KeyboardEvent('keydown', {
                                ...shortcut,
                                bubbles: true
                            }));
                            if (this.editor) {
                                this.editor.dispatchEvent(new KeyboardEvent('keydown', {
                                    ...shortcut,
                                    bubbles: true
                                }));
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                    return true;
                }
            ];

            let success = false;
            for (const method of evaluationMethods) {
                try {
                    if (method()) {
                        success = true;
                        break;
                    }
                } catch (error) {
                    console.log('Evaluation method failed:', error);
                    continue;
                }
            }
            
            if (success) {
                console.log('✅ Code evaluation triggered');
            } else {
                console.warn('⚠️ Could not find evaluation method');
                throw new Error('No evaluation method found');
            }
        }

        stopAll() {
            console.log('🛑 Attempting to stop all patterns');
            
            const stopMethods = [
                () => {
                    const functions = ['hush', 'stop', 'strudelHush', 'stopAll'];
                    for (const funcName of functions) {
                        if (window[funcName] && typeof window[funcName] === 'function') {
                            console.log('🛑 Using global function:', funcName);
                            window[funcName]();
                            return true;
                        }
                    }
                    return false;
                },
                () => {
                    const stopSelectors = [
                        'button[title*="stop"]',
                        'button[aria-label*="stop"]',
                        'button:has(svg[data-icon*="stop"])',
                        '.stop-button'
                    ];
                    
                    for (const selector of stopSelectors) {
                        const button = document.querySelector(selector);
                        if (button) {
                            console.log('🛑 Clicking stop button:', selector);
                            button.click();
                            return true;
                        }
                    }
                    return false;
                }
            ];

            let success = false;
            for (const method of stopMethods) {
                try {
                    if (method()) {
                        success = true;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            this.send({
                type: 'execution_result',
                data: { 
                    success: success, 
                    action: 'stop',
                    error: success ? undefined : 'No stop method found'
                }
            });
        }

        send(message) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
            } else {
                console.warn('⚠️ Cannot send message - WebSocket not connected');
            }
        }

        addConnectionIndicator() {
            const existing = document.getElementById('strudel-mcp-indicator');
            if (existing) {
                existing.remove();
            }

            const indicator = document.createElement('div');
            indicator.id = 'strudel-mcp-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #ff0000;
                z-index: 10000;
                border: 2px solid white;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                transition: all 0.3s ease;
                user-select: none;
            `;

            indicator.title = 'Strudel MCP Bridge Status - Click for debug info';

            indicator.addEventListener('click', () => {
                const status = this.connected ? 'Connected ✅' : 'Disconnected ❌';
                const strudelStatus = this.strudelDetected ? 'Detected ✅' : 'Not detected ❌';
                const editorStatus = this.editor ? 'Found ✅' : 'Not found ❌';
                const audioStatus = this.audioPermissionGranted ? 'Granted ✅' : 'Not granted ❌';
                const editorType = this.editor ? this.editor.className : 'none';
                const buttons = document.querySelectorAll('button').length;
                const queueLength = this.executionQueue.length;

                alert(`🎵 Strudel MCP Bridge v${this.version}
Connection: ${status}
Strudel: ${strudelStatus}
Editor: ${editorStatus}
Audio Permission: ${audioStatus}

Debug Info:
Editor Class: ${editorType}
Buttons Found: ${buttons}
Execution Queue: ${queueLength}
Reconnect Attempts: ${this.reconnectAttempts}
URL: ${window.location.href}
Audio Context State: ${this.audioContext ? this.audioContext.state : 'none'}`);
            });

            indicator.addEventListener('mouseenter', () => {
                indicator.style.transform = 'scale(1.1)';
            });
            indicator.addEventListener('mouseleave', () => {
                indicator.style.transform = 'scale(1.0)';
            });

            document.body.appendChild(indicator);
        }

        updateConnectionStatus(status) {
            const indicator = document.getElementById('strudel-mcp-indicator');
            if (!indicator) return;

            const configs = {
                waiting: { color: '#ffa500', symbol: '⏳' },
                detected: { color: '#0088ff', symbol: '🎵' },
                connecting: { color: '#ffaa00', symbol: '🔄' },
                connected: { color: '#00ff00', symbol: this.audioPermissionGranted ? '🔊' : '🔇' },
                disconnected: { color: '#ff0000', symbol: '❌' },
                timeout: { color: '#ff6600', symbol: '⚠️' },
                error: { color: '#cc0000', symbol: '💥' }
            };

            const config = configs[status] || configs.error;
            indicator.style.background = config.color;
            indicator.textContent = config.symbol;

            if (status === 'connecting') {
                indicator.style.animation = 'pulse 1.5s ease-in-out infinite';
            } else {
                indicator.style.animation = '';
            }
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        const bridge = new StrudelMCPBridge();
        window.strudelMCPBridge = bridge;

        window.debugStrudel = () => {
            console.log('🔍 Strudel MCP Bridge Debug Info:');
            console.log('Bridge instance:', bridge);
            console.log('Editor found:', bridge.editor);
            console.log('Connected:', bridge.connected);
            console.log('Audio permission:', bridge.audioPermissionGranted);
            console.log('Strudel detected:', bridge.strudelDetected);
            
            return {
                bridge,
                editor: bridge.editor,
                connected: bridge.connected,
                audioPermissionGranted: bridge.audioPermissionGranted,
                strudelDetected: bridge.strudelDetected
            };
        };
    }, 1000);

})();
