// background.js - Uses Offscreen Document for Transformers.js inference

let creatingOffscreen = null;

// Ensure the offscreen document exists
async function ensureOffscreenDocument() {
    const offscreenUrl = chrome.runtime.getURL('src/offscreen/offscreen.html');

    // Check if already exists
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) return;

    // Avoid race conditions with multiple callers
    if (creatingOffscreen) {
        await creatingOffscreen;
        return;
    }

    creatingOffscreen = chrome.offscreen.createDocument({
        url: offscreenUrl,
        reasons: ['WORKERS'],
        justification: 'Run Transformers.js ML model for post classification'
    });

    await creatingOffscreen;
    creatingOffscreen = null;
}

// Chrome message listener
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    // Ignore messages that are being forwarded to the offscreen document
    if (req.target) return false;

    if (req.action === "classifyText") {
        ensureOffscreenDocument()
            .then(() => {
                return chrome.runtime.sendMessage({
                    target: 'offscreen',
                    action: 'classify',
                    text: req.text,
                    sensitivity: req.sensitivity ?? 50
                });
            })
            .then((result) => {
                sendResponse(result);
            })
            .catch((error) => {
                console.error("Classification error:", error);
                sendResponse({ error: error.message });
            });
        return true;
    }

    if (req.action === "checkModelStatus") {
        ensureOffscreenDocument()
            .then(() => {
                return chrome.runtime.sendMessage({
                    target: 'offscreen',
                    action: 'checkModelStatus'
                });
            })
            .then((result) => {
                sendResponse(result);
            })
            .catch(() => {
                sendResponse({ ready: false, loading: true });
            });
        return true;
    }

    return false;
});

// Initialize offscreen document on startup
ensureOffscreenDocument().catch((err) => {
    console.error("Failed to create offscreen document:", err);
});
