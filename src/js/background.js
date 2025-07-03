console.log("PMO Filter: Background service worker started.");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Ensure the tab is fully loaded and on the LinkedIn feed
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes("linkedin.com/feed")) {
        // Check the saved state of the filter
        chrome.storage.local.get('pmoFilterEnabled', (data) => {
            // If the filter is enabled, send a message to the content script
            if (data.pmoFilterEnabled) {
                chrome.tabs.sendMessage(tabId, { pmoFilterEnabled: true });
            }
        });
    }
});