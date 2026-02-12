// offscreen.js - Runs Transformers.js inside an offscreen document (MV3-compatible)

import { pipeline, env } from '../../lib/transformers.min.js';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;
env.allowRemoteModels = true;

let classifier = null;
let modelReady = false;
let modelLoading = false;

// PMO labels: posts to blur
const labelsToBlur = new Set([
    "announcing a new job or promotion",
    "internship announcement or reflection",
    "bragging about personal accomplishments",
    "humble bragging or flexing achievements",
    "sharing acceptance to a selective program",
    "celebrating career milestones or awards",
    "AI or tech buzzword thought leadership",
    "motivational career success story",
    "job offer or competing offers announcement",
    "gratitude post about career opportunity"
]);

// All candidate labels (PMO + non-PMO)
const candidateLabels = [
    // PMO labels (will trigger blur)
    "announcing a new job or promotion",
    "internship announcement or reflection",
    "bragging about personal accomplishments",
    "humble bragging or flexing achievements",
    "sharing acceptance to a selective program",
    "celebrating career milestones or awards",
    "AI or tech buzzword thought leadership",
    "motivational career success story",
    "job offer or competing offers announcement",
    "gratitude post about career opportunity",
    // Non-PMO labels (normal content)
    "sharing a news article or link",
    "asking a question for discussion",
    "company marketing or event promotion",
    "general work-related comment",
    "technical project or code discussion",
    "industry news or observation",
    "holiday greeting or special day",
    "advertisement or sponsored content",
    "educational content or tutorial",
    "opinion on current events"
];

// Initialize model
async function initModel() {
    if (modelReady || modelLoading) return;

    modelLoading = true;
    console.log("Offscreen: Loading model...");

    try {
        classifier = await pipeline(
            'zero-shot-classification',
            'Xenova/mobilebert-uncased-mnli'
        );

        modelReady = true;
        modelLoading = false;
        console.log("Offscreen: Model loaded!");
    } catch (error) {
        modelLoading = false;
        console.error("Offscreen: Failed to load model:", error);
    }
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.target !== 'offscreen') return false;

    if (message.action === 'classify') {
        handleClassify(message.text, message.sensitivity).then(sendResponse);
        return true;
    }

    if (message.action === 'checkModelStatus') {
        sendResponse({ ready: modelReady, loading: modelLoading });
        return false;
    }

    return false;
});

async function handleClassify(text, sensitivity = 50) {
    try {
        if (!modelReady) {
            await initModel();
            if (!modelReady) {
                return { error: 'Model failed to load' };
            }
        }

        const result = await classifier(text, candidateLabels, {
            multi_label: false
        });

        const labels = result.labels;
        const scores = result.scores;

        // Sum up scores for all PMO labels
        const blurScore = labels.reduce(
            (sum, label, i) => sum + (labelsToBlur.has(label) ? scores[i] : 0),
            0
        );

        // PMO score as percentage (0-100)
        const pmoScore = Math.round(blurScore * 100);

        // Sensitivity IS the PMO score threshold (0-100 scale)
        const shouldBlur = pmoScore >= sensitivity;

        return {
            shouldBlur,
            label: labels[0],
            score: blurScore,
            pmoScore,
            threshold: sensitivity
        };
    } catch (error) {
        console.error("Classification error:", error);
        return { error: error.message };
    }
}

// Start loading model immediately
initModel();
