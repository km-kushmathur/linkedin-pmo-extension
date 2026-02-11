// content.js - LinkedIn feed post scanner and blurrer

let modelReady = false;
let debounceTimer = null;

// Check if model is ready
async function checkModelStatus() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkModelStatus" }, (response) => {
            if (chrome.runtime.lastError) {
                resolve(false);
                return;
            }
            resolve(response?.ready || false);
        });
    });
}

// Immediately react when settings change (no reload needed)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (changes.enabled) {
        if (changes.enabled.newValue === false) {
            // Toggle OFF: instantly remove all blurs and score badges
            document.querySelectorAll('.blurred').forEach(el => el.classList.remove('blurred'));
            document.querySelectorAll('.pmo-score-badge').forEach(el => el.remove());
            document.querySelectorAll('[data-processed]').forEach(el => el.removeAttribute('data-processed'));
        } else {
            // Toggle ON: re-scan all posts
            document.querySelectorAll('[data-processed]').forEach(el => el.removeAttribute('data-processed'));
            checkForNewPosts();
        }
    }

    if (changes.sensitivity && !changes.enabled) {
        // Re-classify with new sensitivity
        document.querySelectorAll('[data-processed]').forEach(el => {
            el.classList.remove('blurred');
            const badge = el.querySelector('.pmo-score-badge');
            if (badge) badge.remove();
            el.removeAttribute('data-processed');
        });
        debouncedCheck();
    }

    if (changes.showScore) {
        if (changes.showScore.newValue === false) {
            // Hide all score badges
            document.querySelectorAll('.pmo-score-badge').forEach(el => el.remove());
        } else {
            // Show badges: re-process posts to add badges
            document.querySelectorAll('[data-processed]').forEach(el => {
                el.removeAttribute('data-processed');
            });
            checkForNewPosts();
        }
    }
});

// Create a PMO score badge element
function createScoreBadge(pmoScore) {
    const badge = document.createElement('div');
    badge.className = 'pmo-score-badge';

    // Color based on score: green (low) -> yellow (mid) -> red (high)
    let color, bg;
    if (pmoScore < 30) {
        color = '#22c55e';
        bg = 'rgba(34, 197, 94, 0.12)';
    } else if (pmoScore < 60) {
        color = '#f59e0b';
        bg = 'rgba(245, 158, 11, 0.12)';
    } else {
        color = '#ef4444';
        bg = 'rgba(239, 68, 68, 0.12)';
    }

    badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 12px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.3px;
    color: ${color};
    background: ${bg};
    border: 1px solid ${color}33;
    white-space: nowrap;
    margin-right: 4px;
    vertical-align: middle;
    transition: opacity 0.25s ease;
  `;

    badge.innerHTML = `<span style="font-size: 10px; line-height: 1;">PMO</span><span style="line-height: 1;">${pmoScore}</span>`;
    return badge;
}

// Insert badge in the top-right area of the post (absolute positioning)
function insertBadge(post, badge) {
    // Detect which controls are present to calculate right offset
    const hasDismiss = !!post.querySelector(
        'button[aria-label*="Dismiss" i]'
    );
    const hasFollow = !!post.querySelector(
        'button.follow, button[aria-label*="Follow" i], .follows-recommendation-card__follow-btn'
    );

    // Calculate right offset based on which buttons are present
    // When dismiss (X) exists + Follow, Follow is in nested post — use dismiss offset
    // dots only (profile): 48px | dots + X (feed): 84px | dots + Follow (no X): 128px
    let rightOffset = 48;
    if (hasDismiss) {
        rightOffset = 84;
    } else if (hasFollow) {
        rightOffset = 128;
    }

    badge.style.position = 'absolute';
    badge.style.top = '12px';
    badge.style.right = rightOffset + 'px';
    badge.style.zIndex = '20';

    const computed = window.getComputedStyle(post);
    if (computed.position === 'static') {
        post.style.position = 'relative';
    }

    post.appendChild(badge);
}

function checkForNewPosts() {
    chrome.storage.local.get(['enabled', 'sensitivity', 'showScore'], async (result) => {
        if (result.enabled === false) return;

        const sensitivity = result.sensitivity ?? 50;
        const showScore = result.showScore !== false; // default true

        if (!modelReady) {
            modelReady = await checkModelStatus();
            if (!modelReady) return;
        }

        const feed = document.querySelector('.scaffold-finite-scroll__content');
        if (!feed) return;

        const posts = feed.querySelectorAll(
            'div[data-urn*="urn:li:activity:"], li[data-urn*="urn:li:activity:"], ' +
            'div[data-urn*="urn:li:share:"], li[data-urn*="urn:li:share:"]'
        );

        posts.forEach(post => {
            if (post.hasAttribute('data-processed')) return;
            post.setAttribute('data-processed', 'true');

            const textEl = post.querySelector('.feed-shared-update-v2__description, .feed-shared-text, .break-words');
            let text = (textEl ? textEl.innerText : post.innerText)?.trim();

            if (!text) return;

            if (text.length > 500) {
                text = text.slice(0, 500);
            }

            if (text.length < 35 && text.split(' ').length < 6) {
                const allowedShortPhrases = ["started a new position", "new role", "excited to announce"];
                const isAllowed = allowedShortPhrases.some(phrase => text.toLowerCase().includes(phrase));
                if (!isAllowed) return;
            }

            chrome.runtime.sendMessage({ action: "classifyText", text, sensitivity }, (response) => {
                if (chrome.runtime.lastError) return;

                if (response?.shouldBlur) {
                    post.classList.add('blurred');
                }

                // Add score badge if enabled (show on all posts, not just blurred)
                if (showScore && response?.pmoScore !== undefined) {
                    insertBadge(post, createScoreBadge(response.pmoScore));
                }
            });
        });
    });
}

function debouncedCheck() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkForNewPosts, 1000);
}

const observer = new MutationObserver(debouncedCheck);
observer.observe(document.body, { childList: true, subtree: true });

setTimeout(checkForNewPosts, 3000);
