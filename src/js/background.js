console.log("PMO Filter: Background service worker started.");

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    // Ensure we're acting on the main page navigation and not an iframe.
    if (details.frameId !== 0) {
        return;
    }

    if (details.url && details.url.includes("linkedin.com/feed")) {
        // The URL has changed to the LinkedIn feed.
        // Check storage to see if the filter should be active.
        chrome.storage.local.get('pmoFilterEnabled', (data) => {
            if (data.pmoFilterEnabled) {
                // Send a message to the content script in the active tab to enable the filter.
                chrome.tabs.sendMessage(details.tabId, { pmoFilterEnabled: true });
            }
        });
    }
});