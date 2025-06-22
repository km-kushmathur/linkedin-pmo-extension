// Wait for the popup's HTML to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');

    // Get the current saved state and set the switch
    chrome.storage.local.get('pmoFilterEnabled', (data) => {
        toggleSwitch.checked = !!data.pmoFilterEnabled;
    });

    // Check for toggle switch changes
    toggleSwitch.addEventListener('change', () => {
        const isEnabled = toggleSwitch.checked;
        
        // Save the new state
        chrome.storage.local.set({ pmoFilterEnabled: isEnabled });

        // Notify content script to update the state
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { pmoFilterEnabled: isEnabled });
        });
    });
});