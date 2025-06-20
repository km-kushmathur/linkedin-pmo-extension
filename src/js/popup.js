// Wait for the popup's HTML to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');

    // Get the current saved state and set the switch accordingly
    chrome.storage.local.get('pmoFilterEnabled', (data) => {
        toggleSwitch.checked = !!data.pmoFilterEnabled;
    });

    // Listen for changes on the toggle switch
    toggleSwitch.addEventListener('change', () => {
        const isEnabled = toggleSwitch.checked;
        
        // Save the new state
        chrome.storage.local.set({ pmoFilterEnabled: isEnabled });

        // Send a message to the active tab's content script to update its behavior
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { pmoFilterEnabled: isEnabled });
        });
    });
});