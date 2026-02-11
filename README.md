# LinkedIn Post Blurrer

A Chrome extension that detects and blurs "PMO" (Piss Me Off) posts on LinkedIn - those boastful job announcements, humble brags, and buzzword-heavy thought leadership posts cluttering your feed.

## How It Works

Uses **on-device AI** powered by [Transformers.js](https://huggingface.co/docs/transformers.js) to classify LinkedIn posts in real-time. Zero-shot classification determines if a post is PMO (bragging/flexing) and blurs it with a clean overlay. **No data ever leaves your browser.**

### Features

- **Smart Detection** - Catches new job announcements, internship flexes, humble brags, AI buzzword posts, career milestone celebrations, and more
- **Adjustable Sensitivity** - Slider from "Chill" (only obvious PMO) to "Aggressive" (catches borderline posts)
- **PMO Score Badge** - Optional color-coded badge showing the PMO score (0-100) on each post
- **Instant Toggle** - Enable/disable blurring without reloading the page
- **Hover to Reveal** - Blurred posts unblur with a snappy animation on hover
- **Privacy First** - All inference runs locally in your browser

## Project Structure

```
linkedin-pmo-extension/
├── manifest.json             # Chrome extension manifest (MV3)
├── lib/
│   └── transformers.min.js   # Bundled Transformers.js library
├── src/
│   ├── background/
│   │   └── background.js     # Service worker - offscreen document management
│   ├── content/
│   │   ├── content.js        # LinkedIn feed scanner and post classifier
│   │   └── content.css       # Blur styles and animations
│   ├── offscreen/
│   │   ├── offscreen.html    # Offscreen document entry point
│   │   └── offscreen.js      # ML inference engine (zero-shot classification)
│   └── popup/
│       ├── popup.html        # Extension popup UI
│       └── popup.js          # Popup logic (settings, status polling)
├── assets/
│   ├── icon.png              # Source icon (128x128)
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── README.md
├── LICENSE
└── .gitignore
```

## Installation (Development)

1. Clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer Mode** (toggle in top-right)
4. Click **Load unpacked** and select the `linkedin-pmo-extension` folder
5. Navigate to LinkedIn - the model will load automatically (~10-15 seconds on first run, cached after)

## Usage

- **Popup** - Click the extension icon to see model status, adjust sensitivity, or toggle features
- **Sensitivity** - Drag the slider to control how aggressively posts are flagged
- **PMO Scores** - Toggle score badges to see the raw PMO score (0-100) on each post
- **Hover** - Hover over any blurred post to reveal its content

## Tech Stack

- **Chrome Extension Manifest V3** with Offscreen Document API
- **Transformers.js** v2.17.1 (Xenova/mobilebert-uncased-mnli model)
- **Zero-shot Classification** with 20 candidate labels (10 PMO, 10 non-PMO)

## License

MIT License - see [LICENSE](LICENSE) for details.
