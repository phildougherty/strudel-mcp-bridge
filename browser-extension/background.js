// Strudel MCP Bridge Background Script

chrome.runtime.onInstalled.addListener(() => {
    console.log('Strudel MCP Bridge extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Check if we're on a Strudel page
    if (tab.url.includes('strudel.cc') || tab.url.includes('localhost:3000')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                if (window.strudelMCPBridge) {
                    const status = window.strudelMCPBridge.connected ? 'connected' : 'disconnected';
                    alert(`Strudel MCP Bridge is ${status}`);
                } else {
                    alert('Strudel MCP Bridge not found. Make sure you\'re on strudel.cc');
                }
            }
        });
    } else {
        chrome.tabs.create({ url: 'https://strudel.cc' });
    }
});

// Monitor tab updates to inject script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        (tab.url.includes('strudel.cc') || tab.url.includes('localhost:3000'))) {
        console.log('Strudel page loaded, content script should be active');
    }
});
