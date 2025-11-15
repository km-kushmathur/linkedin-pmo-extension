// popup.js

const saveButton = document.getElementById('saveButton');
const apiTokenInput = document.getElementById('apiToken');
const statusDiv = document.getElementById('status');
const enableToggle = document.getElementById('enableToggle');

// Load any previously saved token and enabled state when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['hf_api_token', 'enabled'], (result) => {
    if (result.hf_api_token) {
      apiTokenInput.value = result.hf_api_token;
    }
    enableToggle.checked = result.enabled !== false; // Default to true if not set
  });
});

// Save the new token when the button is clicked
saveButton.addEventListener('click', () => {
  const token = apiTokenInput.value;
  if (token) {
    chrome.storage.local.set({ hf_api_token: token }, () => {
      statusDiv.textContent = '✓ Token saved successfully!';
      statusDiv.className = 'success';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 2000);
    });
  } else {
    statusDiv.textContent = '✗ Please enter a token';
    statusDiv.className = 'error';
  }
});

// Save the enabled state when the toggle changes
enableToggle.addEventListener('change', (e) => {
  chrome.storage.local.set({ enabled: e.target.checked });
});