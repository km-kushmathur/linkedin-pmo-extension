// background.js — stable direct inference version

const modelId = "facebook/bart-large-mnli";
const API_URL = `https://api-inference.huggingface.co/models/${modelId}`;

const candidateLabels = [
  "promotion announcement","started a new position","internship update or reflection",
  "summer opportunity","joining a company this summer","what I've been up to recently",
  "sharing a news article or link","asking a question for discussion","company marketing or event",
  "general work-related comment","technical project discussion","industry observation",
  "holiday or special day","advertisement"
];

const labelsToBlur = new Set([
  "promotion announcement","started a new position","internship update or reflection",
  "summer opportunity","joining a company this summer","what I've been up to recently"
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

// --- Classification logic ---
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

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.labels || !result?.scores) throw new Error("Unexpected response");

  const topLabel = result.labels[0];
  const topScore = result.scores[0];
  const blurScore = result.labels.reduce(
    (sum, l, i) => sum + (labelsToBlur.has(l) ? result.scores[i] : 0),
    0
  );

  console.log(`🏆 ${topLabel} (${topScore.toFixed(2)}), Σ blur: ${blurScore.toFixed(2)}`);

  return {
    shouldBlur: blurScore >= 0.5,
    label: topLabel,
    score: blurScore >= 0.5 ? blurScore : topScore
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
