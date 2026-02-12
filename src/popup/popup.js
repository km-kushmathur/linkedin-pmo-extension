// popup.js

const enableToggle = document.getElementById('enableToggle');
const showScoreToggle = document.getElementById('showScoreToggle');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const sensitivitySlider = document.getElementById('sensitivitySlider');
const sensitivityValue = document.getElementById('sensitivityValue');

let sensitivitySaveTimer = null;

// Load saved state
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['enabled', 'sensitivity', 'showScore'], (result) => {
        enableToggle.checked = result.enabled !== false;
        showScoreToggle.checked = result.showScore !== false; // default true
        const sens = result.sensitivity ?? 50;
        sensitivitySlider.value = sens;
        sensitivityValue.textContent = sens;
    });

    pollModelStatus();
});

// Save settings immediately on toggle changes
enableToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ enabled: e.target.checked });
});

showScoreToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ showScore: e.target.checked });
});

// Debounce sensitivity slider to avoid spamming re-classification
sensitivitySlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    sensitivityValue.textContent = val;

    clearTimeout(sensitivitySaveTimer);
    sensitivitySaveTimer = setTimeout(() => {
        chrome.storage.local.set({ sensitivity: val });
    }, 400);
});

// Poll model status
function pollModelStatus() {
    chrome.runtime.sendMessage({ action: "checkModelStatus" }, (response) => {
        if (chrome.runtime.lastError) {
            setStatus('error', 'Extension error');
            return;
        }

        if (response?.ready) {
            setStatus('ready', 'Model ready');
        } else if (response?.loading) {
            setStatus('loading', 'Loading model...');
            setTimeout(pollModelStatus, 2000);
        } else {
            setStatus('loading', 'Initializing...');
            setTimeout(pollModelStatus, 2000);
        }
    });
}

function setStatus(state, text) {
    statusDot.className = 'status-dot ' + state;
    statusText.textContent = text;
}
