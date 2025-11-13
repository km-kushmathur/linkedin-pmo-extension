// Run script with this after adding token:
/*
curl -X POST "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli" \
-H "Authorization: Bearer ADD_TOKEN_HERE" \
-H "Content-Type: application/json" \
-d '{
  "inputs": "Hello, this is a test message.",
  "parameters": {
    "candidate_labels": ["positive", "negative"],
    "multi_label": false
  }
}'
*/

const modelId = "facebook/bart-large-mnli";
const API_URL = `https://router.huggingface.co/hf-inference/models/${modelId}`;

async function testToken() {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    console.error("❌ Error: Set HF_API_TOKEN environment variable with your Hugging Face token.");
    process.exit(1);
  }

  const payload = {
    inputs: "Hello, this is a test message.",
    parameters: { candidate_labels: ["positive", "negative"], multi_label: false }
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Token is working! API Response:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Token test failed:", error.message);
  }
}

testToken();