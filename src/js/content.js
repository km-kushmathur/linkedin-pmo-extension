import { aiClassifier } from './ai-classifier.js';
console.log("PMO Filter: Content script injected and running!");

/*
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
*/

const POST_SELECTOR = "div[data-urn^='urn:li:share:'], div[data-urn^='urn:li:activity:']";
let observer = null;
let scanInterval = null;

// Reveal and Blur Functions
function revealPostOnHover(event) {
    event.currentTarget.style.filter = "blur(0px)";
}
function blurPostOnMouseOut(event) {
    event.currentTarget.style.filter = "blur(8px)";
}

// Check if a post contains any PMO trigger phrases
async function postContainsTrigger(post) {
    try {
        const postText = post.innerText;
        if (!postText || postText.trim().length === 0) {
            return false;
        }
        return await aiClassifier.classifyPost(postText);
    } catch (error) {
        console.error('PMO Filter: Error classifying post:', error);
        // Fallback to basic text matching if AI fails
        const postText = post.innerText || '';
        const basicPattern = /\b(?:excited|thrilled|proud|announce|happy to share|new job|new position)\b/i;
        return basicPattern.test(postText);
    }
}

function censorPost(post) {
    post.style.filter = "blur(8px)";
    post.style.transition = "filter 0.3s";
    post.dataset.pmoCensored = "true";
    post.addEventListener('mouseover', revealPostOnHover);
    post.addEventListener('mouseout', blurPostOnMouseOut);
}

async function scanAndCensorAllPosts() {
    try {
        const posts = document.querySelectorAll(POST_SELECTOR);
        if (posts.length > 0) {
            console.log(`PMO Filter: Scanning ${posts.length} posts with AI...`);
        }
        for (const post of posts) {
            if (post.dataset.pmoScanned) continue;
            try {
                if (await postContainsTrigger(post)) {
                    censorPost(post);
                }
            } catch (error) {
                console.error('PMO Filter: Error processing individual post:', error);
            }
            post.dataset.pmoScanned = "true";
        }
    } catch (error) {
        console.error('PMO Filter: Error during post scanning:', error);
    }
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
async function enableFilter() {
    console.log("PMO Filter: Enabling filter...");
    resetScannedState();
    await scanAndCensorAllPosts();

    if (!scanInterval) {
        scanInterval = setInterval(() => {
            scanAndCensorAllPosts();
        }, 500);
    }

    const feedContainer = document.querySelector('main');
    if (feedContainer && !observer) {
        observer = new MutationObserver(() => {
            scanAndCensorAllPosts();
        });
        observer.observe(feedContainer, { childList: true, subtree: true });
        console.log("PMO Filter: MutationObserver enabled.");
    }
}

function disableFilter() {
    console.log("PMO Filter: Disabling filter...");
    if (observer) {
        observer.disconnect();
        observer = null;
        console.log("PMO Filter: MutationObserver disabled.");
    }
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    unCensorAllPosts();
    resetScannedState();
}

chrome.runtime.onMessage.addListener((request) => {
    console.log("PMO Filter: Message received from background/popup", request);
    if (request.pmoFilterEnabled) {
        enableFilter();
    } else {
        disableFilter();
    }
});

chrome.storage.local.get('pmoFilterEnabled', (data) => {
    if (data.pmoFilterEnabled) {
        console.log("PMO Filter: Filter is enabled on page load.");
        enableFilter();
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'pmoFilterEnabled' in changes) {
        if (changes.pmoFilterEnabled.newValue) {
            enableFilter();
        } else {
            disableFilter();
        }
    }
});