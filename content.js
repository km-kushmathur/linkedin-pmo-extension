// content.js

function checkForNewPosts() {
  const feed = document.querySelector('.scaffold-finite-scroll__content');
  if (!feed) return;

  // This selector for finding post containers is good and unchanged.
  const posts = feed.querySelectorAll('div[data-urn*="urn:li:activity:"], li[data-urn*="urn:li:activity:"], div[data-urn*="urn:li:share:"], li[data-urn*="urn:li:share:"]');

  posts.forEach(post => {
    if (post.hasAttribute('data-processed')) return;
    post.setAttribute('data-processed', 'true');

    // --- START: NEW TWO-STEP LOGIC ---

    // Step 1: Try to find text using your known-working selectors
    let postContent = post.querySelector(
      // 1. Text for shared posts (in the "commentary" box)
      'div[class*="commentary"] span[dir="ltr"]',
      
      // 2. Text for original posts (inside the "update-components-text" box)
      'div[class*="update-components-text"] span[dir="ltr"]',

      // 3. A common class for the "see more" text body
      '.feed-shared-update-v2__description-wrapper span[dir="ltr"]',

      // 4. Fallback: text directly in the commentary container
      'div[class*="commentary"]',

      // 5. Fallback: text directly in the main text container
      'div[class*="update-components-text"]'
    );

    let text = postContent?.innerText?.trim();

    // Step 2: If no text was found, *now* check for the job update format.
    if (!text) {
      // These are more specific selectors for those job update boxes
      const jobUpdateContent = post.querySelector(
          'span[class*="feed-shared-job-update__title-text"]', // Catches "Started a new position"
          'span[class*="feed-shared-job-update__description"]'  // Catches "Student Volunteer at UVA Health"
      );
      text = jobUpdateContent?.innerText?.trim();
    }

    // Step 3: If there is *still* no text, now we skip.
    if (!text) {
      console.log("⚪ Skipped empty or non-text post");
      return;
    }
    // --- END: NEW TWO-STEP LOGIC ---


    // --- START: MODIFIED GUARD CLAUSE ---
    // We make this check *after* finding text, but allow known short
    // phrases like "Started a new position" to pass.
    if (text.length < 35 && text.split(' ').length < 6) {
      
      const allowedShortPhrases = [
        "started a new position"
      ];

      // Check if the text *includes* one of our allowed short phrases
      const isAllowed = allowedShortPhrases.some(phrase => text.toLowerCase().includes(phrase));

      if (!isAllowed) {
        console.log(`⚪ Skipped short text (likely a name/title): "${text}"`);
        return;
      }
      // If it *is* allowed, we let it continue to the AI
    }
    // --- END: MODIFIED GUARD CLAUSE ---

    console.log("✅ Found post, sending text to AI:", text.slice(0, 120));

    // This messaging logic is good and unchanged.
    chrome.runtime.sendMessage({ action: "classifyText", text }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("❌ Message failed:", chrome.runtime.lastError.message);
        return;
      }

      if (response?.shouldBlur) {
        console.log(`✅ Blurring post (Reason: '${response.label}', Score: ${response.score})`);
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