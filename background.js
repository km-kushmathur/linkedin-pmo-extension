// background.js — stable direct inference version

const modelId = "facebook/bart-large-mnli";
const API_URL = `https://router.huggingface.co/hf-inference/models/${modelId}`;

const candidateLabels = [
  "started a new position",
  "internship update or reflection",
  "summer opportunity",
  "joining a company this summer",
  "what I've been up to recently",
  "sharing a news article or link",
  "asking a question for discussion",
  "company marketing or event",
  "general work-related comment",
  "technical project discussion",
  "industry observation",
  "holiday or special day",
  "advertisement",
  "new technology"
];

const labelsToBlur = new Set([
  "started a new position",
  "internship update or reflection",
  "summer opportunity",
  "joining a company this summer",
  "what I've been up to recently"
]);

// --- Retry helper ---
async function fetchWithRetry(url, options, retries = 2, delay = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      console.log(`HF API status: ${res.status} (attempt ${i + 1})`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("HF fetch error:", err.message);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("HF API failed after retries");
}

// --- Queue manager ---
let queue = [];
let running = false;

function enqueueRequest(text, apiToken, callback) {
  queue.push({ text, apiToken, callback });
  if (!running) processQueue();
}

async function processQueue() {
  if (queue.length === 0) return (running = false);
  running = true;

  const { text, apiToken, callback } = queue.shift();
  try {
    const result = await classifyPost(text, apiToken);
    callback(result);
  } catch (e) {
    callback({ error: e.message });
  }

  // slight spacing prevents throttling
  setTimeout(processQueue, 400);
}

// --- Classification logic (FIXED with new logging) ---
async function classifyPost(text, apiToken) {
  const payload = {
    inputs: text,
    parameters: { candidate_labels: Array.from(candidateLabels), multi_label: false }
  };

  const data = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  // --- START: PARSING LOGIC ---
  if (!Array.isArray(data)) {
    console.error("❌ Error: API response was not an array.");
    throw new Error("Unexpected response structure: expected an array.");
  }

  const labels = data.map(item => item.label);
  const scores = data.map(item => item.score);

  if (!labels.length || !scores.length || labels.length !== scores.length) {
    console.error("❌ Error: 'labels' or 'scores' arrays are empty or mismatched.");
    throw new Error("Unexpected response structure: failed to parse arrays.");
  }
  // --- END: PARSING LOGIC ---

  const topLabel = labels[0];
  const topScore = scores[0];

  // Calculate the total score of all "blur" labels
  const blurScore = labels.reduce(
    (sum, l, i) => sum + (labelsToBlur.has(l) ? scores[i] : 0),
    0
  );

  const shouldBlur = blurScore >= 0.6;

  // --- START: NEW DETAILED, READABLE LOGGING ---
  const logTitle = shouldBlur
    ? `🔴 BLURRING (Total Blur Score: ${blurScore.toFixed(3)})`
    : `🟢 LEAVING VISIBLE (Total Blur Score: ${blurScore.toFixed(3)})`;
  
  // Create a collapsible group in the console
  console.group(logTitle);
  console.log(`Original Text (snippet): "${text.slice(0, 100)}..."`);
  
  // Log all scores
  console.log("--- Full Classification Scores ---");
  labels.forEach((label, i) => {
    const score = scores[i];
    if (labelsToBlur.has(label)) {
      // Highlight labels that contribute to the blur score
      console.log(`  %c(BLUR) ${label}:%c ${score.toFixed(3)}`, 'font-weight: bold; color: #b91c1c;', 'color: inherit;');
    } else {
      console.log(`  (no) ${label}: ${score.toFixed(3)}`);
    }
  });

  console.groupEnd();
  // --- END: NEW DETAILED, READABLE LOGGING ---

  return {
    shouldBlur: shouldBlur,
    label: topLabel,
    score: shouldBlur ? blurScore : topScore
  };
}


// --- Chrome message listener ---
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "classifyText") {
    chrome.storage.local.get(["hf_api_token"], (res) => {
      if (!res.hf_api_token) return sendResponse({ error: "Missing API token" });
      enqueueRequest(req.text, res.hf_api_token, sendResponse);
    });
    return true;
  }
});