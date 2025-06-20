console.log("PMO Filter: Content script injected and running!");

// --- Configuration ---
// Add any keywords or phrases you want to detect here.
// The script will not be case-sensitive.
const TRIGGER_PHRASES = [
    "i'm thrilled to announce",
    "i'm excited to announce",
    "i am excited to announce",
    "i'm excited to share",
    "i am excited to share",
    "i am thrilled to announce",
    "i am thrilled",
    "so excited to share",
    "excited to start",
    "landed an internship",
    "humbled to announce",
    "after 100 rejections",
    "with no experience",
    "dream internship",
    "used ai to build",
    "so can you!",
    "don’t get left behind",
    "I’m happy to share",
    "I am happy to share",
    "started a new position",
];

// This is the CSS selector for a single post on the LinkedIn feed.
// LinkedIn might change this in the future, which could break the extension.
const POST_SELECTOR = ".feed-shared-update-v2";

// --- Core Logic ---

/**
 * Scans a single post element to see if it contains any trigger phrases.
 * @param {HTMLElement} post - The DOM element of the post to scan.
 * @returns {boolean} - True if a trigger phrase is found, otherwise false.
 */
function postContainsTrigger(post) {
    const postText = post.innerText.toLowerCase();
    for (const phrase of TRIGGER_PHRASES) {
        if (postText.includes(phrase)) {
            console.log(`PMO Filter: Found trigger phrase "${phrase}"`);
            return true;
        }
    }
    return false;
}

/**
 * Censors a single post element by blurring it.
 * @param {HTMLElement} post - The DOM element of the post to censor.
 */
function censorPost(post) {
    post.style.filter = "blur(8px)";
    post.style.transition = "filter 0.3s"; // Adds a smooth transition effect
    
    // Optional: Add a hover effect to reveal the post
    post.addEventListener('mouseover', () => {
        post.style.filter = "blur(0px)";
    });
     post.addEventListener('mouseout', () => {
        post.style.filter = "blur(8px)";
    });
}

/**
 * Finds all posts on the page and censors them if they contain trigger phrases.
 * It only processes posts that haven't been scanned yet.
 */
function scanAndCensorAllPosts() {
    const posts = document.querySelectorAll(POST_SELECTOR);
    posts.forEach(post => {
        // Check if we've already processed this post to avoid redundant work
        if (post.dataset.pmoScanned) {
            return;
        }

        if (postContainsTrigger(post)) {
            censorPost(post);
        }

        // Mark the post as scanned so we don't process it again
        post.dataset.pmoScanned = "true";
    });
}


// --- Execution ---

// The LinkedIn feed loads content dynamically as you scroll.
// A MutationObserver is the correct way to watch for new posts being added to the feed.
const observer = new MutationObserver((mutations) => {
    // We can run our scan function whenever the feed changes.
    // A slight delay can help ensure the new post is fully rendered.
    setTimeout(scanAndCensorAllPosts, 500);
});

// Start observing the main feed container for changes.
const feedContainer = document.querySelector('main');
if (feedContainer) {
    observer.observe(feedContainer, {
        childList: true,
        subtree: true
    });
}

// Run the scan once on page load to catch the initial posts.
setTimeout(scanAndCensorAllPosts, 1000);