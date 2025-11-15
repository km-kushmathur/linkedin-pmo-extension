// content.js

function checkForNewPosts() {
  const feed = document.querySelector('.scaffold-finite-scroll__content');
  if (!feed) return;

  const posts = feed.querySelectorAll('div[data-urn*="urn:li:activity:"], li[data-urn*="urn:li:activity:"], div[data-urn*="urn:li:share:"], li[data-urn*="urn:li:share:"]');

  posts.forEach(post => {
    if (post.hasAttribute('data-processed')) return;
    post.setAttribute('data-processed', 'true');

    // --- START: NEW, SIMPLIFIED LOGIC ---
    // Instead of complex selectors, just grab ALL text from the post.
    // The AI is smart enough to find the signal ("started a new position")
    // in the noise ("Like", "Comment", "Share", etc.).
    
    let text = post.innerText?.trim();

    // If there is *genuinely* no text, skip it.
    if (!text) {
      console.log("⚪ Skipped empty or non-text post");
      return;
    }
    // --- END: NEW, SIMPLIFIED LOGIC ---


    // --- START: MODIFIED GUARD CLAUSE ---
    // This guard clause is still useful.
    // It will skip *truly* short content (like just a name),
    // but a full post (even a job update) will have enough
    // text to pass this check.
    if (text.length < 35 && text.split(' ').length < 6) {
      
      const allowedShortPhrases = [
        "started a new position"
      ];

      // Check if the text *includes* one of our allowed short phrases
      const isAllowed = allowedShortPhrases.some(phrase => text.toLowerCase().includes(phrase));

      if (!isAllowed) {
        console.log(`⚪ Skipped short text: "${text.slice(0, 50)}..."`);
        return;
      }
    }
    // --- END: MODIFIED GUARD CLAUSE ---

    console.log("✅ Found post, sending text to AI:", text.replace(/\n/g, " ").slice(0, 120));

    // This messaging logic is good and unchanged.
    chrome.runtime.sendMessage({ action: "classifyText", text }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("❌ Message failed:", chrome.runtime.lastError.message);
        return;
      }

      if (response?.shouldBlur) {
        console.log(`🔴 Blurring post (Reason: '${response.label}', Score: ${response.score})`);
        post.classList.add('blurred');
      } else if (response?.error) {
        console.error("❌ Classification Error:", response.error);
      } else {
        console.log("ℹ️ Post left visible (no trigger label).");
      }
    });
  });
}

// Observe page changes
const observer = new MutationObserver(() => {
  setTimeout(checkForNewPosts, 500);
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
setTimeout(checkForNewPosts, 1000);