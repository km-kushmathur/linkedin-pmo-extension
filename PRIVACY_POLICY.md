# Privacy Policy — LinkedIn Post Blurrer

**Last updated:** February 12, 2026

## Overview

LinkedIn Post Blurrer is a Chrome extension that uses on-device AI to classify and blur LinkedIn posts. **Your privacy is our top priority — no personal data ever leaves your browser.**

## Data Collection

**We do not collect, store, transmit, or sell any user data.** Specifically:

- **No personal information** is collected (name, email, browsing history, etc.)
- **No LinkedIn post content** is sent to any external server
- **No analytics or tracking** is used
- **No cookies** are set by this extension
- **No accounts or logins** are required

## How the Extension Works

1. The extension reads LinkedIn post text **locally in your browser** to classify it using an AI model
2. All AI inference runs **entirely on your device** using Transformers.js and WebAssembly
3. Classification results (blur/no-blur) are stored **only in local browser storage** and never transmitted

## Network Requests

The extension makes network requests **only** to download the AI model weights:

- **Destination:** `https://huggingface.co` (Hugging Face model hub)
- **Data sent:** Standard HTTP requests to download model files (no user data is included)
- **Frequency:** Once on first install; the model is cached locally by the browser after that
- **Purpose:** Download the `Xenova/mobilebert-uncased-mnli` zero-shot classification model

No LinkedIn content, user data, or browsing information is ever included in these requests.

## Permissions Justification

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Save user preferences (blur on/off, sensitivity threshold, score badge toggle) locally |
| `offscreen` | Run the ML model in a background document (required for WebAssembly inference in Manifest V3) |
| `host_permissions: linkedin.com` | Read LinkedIn post text on the page to classify it locally |
| `host_permissions: huggingface.co` | Download AI model weights on first install |

## Data Storage

All data is stored locally using `chrome.storage.local`:

- `enabled` — whether blurring is active (boolean)
- `sensitivity` — PMO score threshold (integer 0–100)
- `showScore` — whether to display score badges (boolean)

This data never leaves your device and is deleted when the extension is uninstalled.

## Third-Party Services

- **Hugging Face** (`huggingface.co`): Used solely to download open-source ML model weights. See [Hugging Face Privacy Policy](https://huggingface.co/privacy). No user data is shared with Hugging Face.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date above.

## Contact

For questions about this privacy policy, please open an issue on our [GitHub repository](https://github.com/km-kushmathur/linkedin-pmo-extension).
