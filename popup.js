// popup.js

const saveButton = document.getElementById('saveButton');
const apiTokenInput = document.getElementById('apiToken');
const statusDiv = document.getElementById('status');

// Load any previously saved token when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['hf_api_token'], (result) => {
    if (result.hf_api_token) {
      apiTokenInput.value = result.hf_api_token;
    }
  });
});

// Save the new token when the button is clicked
saveButton.addEventListener('click', () => {
  const token = apiTokenInput.value;
  if (token) {
    chrome.storage.local.set({ hf_api_token: token }, () => {
      statusDiv.textContent = 'Token saved!';
      statusDiv.style.color = 'green';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    });
  } else {
    statusDiv.textContent = 'Please enter a token.';
    statusDiv.style.color = 'red';
  }
});