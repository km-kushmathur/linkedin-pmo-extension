// Content file is used for actually interacting with LinkedIn page content
// CSS Selector for full post: .feed-shared-update-v2
// CSS Selector for text in post: .feed-shared-update-v2__description
// CSS Selector for full feed: main[aria-label="Main Feed"]

const post_selector = '.feed-shared-update-v2'
const text_selector = '.feed-shared-update-v2__description'
const feed_selector = 'main[aria-label="Main Feed"]'

// @param {NodeListOf<Element>} listOfPosts: A list containing all the feeds posts
function postProcessor(listOfPosts) {
    for (const post of listOfPosts) { // Loop through each post in the list of posts
        const rawText = post.querySelector(text_selector);
    }
    if (rawText) {
        const postText = rawText.innerText; // Grabs exact formatting as on Linkedin including CSS
        console.log("Post Text: ", postText.trim()) // Prints post text without whitespace at start/end
    }
}

const initialPosts = document.querySelectorAll(post_selector); // Posts that load when you go on feed page
if (initialPosts.length > 0) {
    postProcessor(initialPosts);
}

const fullFeed = document.querySelector(feed_selector);

// @param {MutationLog[]} mutationList - Store all of the mutations that occur (ex. new post)
const dealWithChanges = (mutationList) => {
    for (const mutation of mutationList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const newPosts = [];
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // 1 is predefined to mean an Element node like a div
                    if (node.matches(post_selector)) {
                }
        }
    }
}