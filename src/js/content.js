console.log("PMO Filter: Content script injected and running!");

// PMO Phrases
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
    "i'm happy to share",
    "i am happy to share",
    "started a new position",
    "to share",
    "to announce",
    "milestone",
    "opportunity",
];
const POST_SELECTOR = ".feed-shared-update-v2";
let observer = null;

// Reveal and Blur Functions
function revealPostOnHover(event) {
    event.currentTarget.style.filter = "blur(0px)";
}
function blurPostOnMouseOut(event) {
    event.currentTarget.style.filter = "blur(8px)";
}

// Check if a post contains any PMO trigger phrases
function postContainsTrigger(post) {
    const postText = post.innerText.toLowerCase();
    for (const phrase of TRIGGER_PHRASES) {
        if (postText.includes(phrase)) {
            return true;
        }
    }
    return false;
}

function censorPost(post) {
    post.style.filter = "blur(8px)";
    post.style.transition = "filter 0.3s";
    post.dataset.pmoCensored = "true";

    post.addEventListener('mouseover', revealPostOnHover);
    post.addEventListener('mouseout', blurPostOnMouseOut);
}

function scanAndCensorAllPosts() {
    const posts = document.querySelectorAll(POST_SELECTOR);
    posts.forEach(post => {
        if (post.dataset.pmoScanned) return;
        if (postContainsTrigger(post)) censorPost(post);
        post.dataset.pmoScanned = "true";
    });
}

function unCensorAllPosts() {
    const censoredPosts = document.querySelectorAll('[data-pmo-censored="true"]');
    censoredPosts.forEach(post => {
        post.style.filter = "";
        post.style.transition = "";
        post.removeEventListener('mouseover', revealPostOnHover);
        post.removeEventListener('mouseout', blurPostOnMouseOut);
        delete post.dataset.pmoCensored;
    });
    console.log("PMO Filter: All posts uncensored and listeners removed.");
}

function resetScannedState() {
    const scannedPosts = document.querySelectorAll('[data-pmo-scanned="true"]');
    scannedPosts.forEach(post => {
        delete post.dataset.pmoScanned;
    });
    console.log("PMO Filter: Scanned state reset for all posts.");
}

// Manage the filter state
function enableFilter() {
    console.log("PMO Filter: Enabling...");
    scanAndCensorAllPosts();

    const feedContainer = document.querySelector('main');
    if (feedContainer && !observer) {
        observer = new MutationObserver(scanAndCensorAllPosts);
        observer.observe(feedContainer, { childList: true, subtree: true });
        console.log("PMO Filter: Observer enabled.");
    }
}

function disableFilter() {
    console.log("PMO Filter: Disabling...");
    if (observer) {
        observer.disconnect();
        observer = null;
        console.log("PMO Filter: Observer disabled.");
    }
    unCensorAllPosts();
    resetScannedState(); 
}

// Popup script sends a message to content script to toggle the filter
chrome.runtime.onMessage.addListener((request) => {
    if (request.pmoFilterEnabled) {
        enableFilter();
    } else {
        disableFilter();
    }
});

// Check the initial state when the page loads
chrome.storage.local.get('pmoFilterEnabled', (data) => {
    if (data.pmoFilterEnabled) {
        enableFilter();
    }
});