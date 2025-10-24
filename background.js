// background.js

const modelId = "facebook/bart-large-mnli";
const API_URL = `https://api-inference.huggingface.co/models/${modelId}`;

// In background.js

// 1. Refined candidate labels to target your specific goals
const candidateLabels = [
  "promotion announcement", // BLUR
  "started a new position", // BLUR
  "internship update or reflection", // New label for internships
  "summer opportunity", // More specific "summer" label
  "joining a company this summer", // BLUR 
  "sharing a news article or link",
  "asking a question for discussion",
  "company marketing or event",
  "general work-related comment",
  "technical project discussion",
  "industry observation"
];

// 2. Update the labels to blur
const labelsToBlur = [
  "promotion announcement",
  "started a new position",
  "internship update or reflection",
  "summer opportunity",
  "joining a company this summer"
];

// --- Retry wrapper for fetch ---
async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      console.warn(`HF API call failed (attempt ${i + 1}): ${response.status}`);
    } catch (err) {
      console.warn(`HF API network error (attempt ${i + 1}): ${err.message}`);
    }
    await new Promise(res => setTimeout(res, delay));
  }
  throw new Error(`API request failed after ${retries} retries`);
}

// --- Request queue for throttling ---
let queue = [];
let isProcessing = false;

function enqueueRequest(text, apiToken, callback) {
  queue.push({ text, apiToken, callback });
  processQueue();
}

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  const { text, apiToken, callback } = queue.shift();

  try {
    const result = await classifyPost(text, apiToken);
    callback(result);
  } catch (err) {
    callback({ error: err.message });
  }

  // process next after a short delay
  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, 1000);
}

// --- Classification function ---
async function classifyPost(text, apiToken) {
  try {
    const response = await fetchWithRetry(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: { 
          candidate_labels: candidateLabels, 
          multi_label: false   // best match only
        },
      }),
    });

    const data = await response.json();
    console.log("✅ Raw HF response:", JSON.stringify(data, null, 2));

    const result = Array.isArray(data) ? data[0] : data;
    if (!result.labels || !result.scores) {
      throw new Error("Unexpected API response format");
    }

// In background.js, replace the final logic in the classifyPost function

    const topLabel = result.labels[0];
    const topScore = result.scores[0];
    console.log(`🏆 Top label: ${topLabel} (${topScore.toFixed(4)})`);

    // --- NEW LOGIC: Calculate a combined score for all blur-worthy labels ---
    let combinedBlurScore = 0;
    result.labels.forEach((label, index) => {
      if (labelsToBlur.includes(label)) {
        combinedBlurScore += result.scores[index];
      }
    });

    console.log(`ℹ️ Combined score for blurrable labels: ${combinedBlurScore.toFixed(4)}`);

    const combinedThreshold = 0.5; // Use a new threshold for the combined score

    if (combinedBlurScore >= combinedThreshold) {
      console.log(`🔴 Blur triggered by combined score of ${combinedBlurScore.toFixed(4)} (Top Label: '${topLabel}')`);
      // We can still return the top label just for informational purposes
      return { shouldBlur: true, label: topLabel, score: combinedBlurScore };
    }

    console.log("ℹ️ Not blurred — combined score was below the threshold.");
    return { shouldBlur: false, label: topLabel, score: topScore };
  } catch (error) {
    console.error("❌ classifyPost error:", error.message);
    return { error: error.message };
  }
}

// --- Listener for messages from content.js ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "classifyText") {
    chrome.storage.local.get(["hf_api_token"], (result) => {
      const apiToken = result.hf_api_token;

      if (!apiToken) {
        console.error("CRITICAL: API Token not found. Please set it in the popup.");
        sendResponse({ error: "API token not set." });
        return;
      }

      enqueueRequest(request.text, apiToken, sendResponse);
    });

    return true; // keep channel open
  }
});
