console.log("Data Footprint Minimizer content script loaded.");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "summarize_policy") {
    summarizePrivacyPolicy();
  } else if (request.action === "manage_cookies") {
    findAndHighlightCookieBanners();
  }
});

/**
 * Finds and highlights cookie banners on the page.
 */
function findAndHighlightCookieBanners() {
  const selectors = [
    '[id*="cookie"]',
    '[class*="cookie"]',
    '[id*="banner"]',
    '[class*="banner"]',
    '[id*="consent"]',
    '[class*="consent"]',
  ];
  let bannerFound = false;
  document.querySelectorAll(selectors.join(", ")).forEach((el) => {
    // Simple filter to avoid highlighting tiny or irrelevant elements
    if (el.offsetHeight > 50 && el.innerText.toLowerCase().includes("cookie")) {
      el.style.border = "3px solid #EF4444";
      el.style.boxShadow = "0 0 15px #EF4444";
      bannerFound = true;
    }
  });

  if (bannerFound) {
    showNotification(
      "Cookie banner detected and highlighted. In a full version, we would attempt to auto-reject non-essential cookies."
    );
  } else {
    showNotification("No obvious cookie banners found on this page.");
  }
}

/**
 * Finds the privacy policy link, scrapes the content, and shows a summary modal.
 */
function summarizePrivacyPolicy() {
  // Look for a link with "Privacy" or "Policy"
  const policyLink = Array.from(document.links).find(
    (link) => /privacy|policy/i.test(link.innerText) && link.href
  );

  if (!policyLink) {
    showNotification("Could not find a privacy policy link on this page.");
    return;
  }

  // Since we cannot directly navigate and scrape due to security restrictions in extensions,
  // we'll simulate the process by showing what we *would* summarize.
  // In a real extension, you would fetch(policyLink.href), parse the HTML, and then summarize.
  const policyText = document.body.innerText;
  const summary = generateSimpleSummary(policyText);
  showSummaryModal(summary, policyLink.href);
}

/**
 * SIMULATED NLP: Generates a simple summary by extracting key sentences.
 * @param {string} text The full text of the privacy policy.
 * @returns {object} An object containing key points.
 */
function generateSimpleSummary(text) {
  const sentences = text.split(/[.\n]/);
  const summary = {
    collection: new Set(),
    sharing: new Set(),
    retention: new Set(),
    red_flags: new Set(),
  };

const keywords = {
    collection: [
        "collect",
        "gather",
        "receive",
        "information you provide",
        "data we collect",
        "personal data",
        "information we collect",
        "data we gather",
        "data collection",
        "data we receive",
        "data we obtain"
    ],
    sharing: [
        "share",
        "disclose",
        "third parties",
        "sell your data",
        "share your information",
        "disclose your data",
        "third-party sharing",
        "data sharing",
        "sell your information",
        "share with partners",
        "share with third parties",
        "share with affiliates",
        "share with service providers",
        "share with vendors",
        "share with analytics providers",
        "share with contractors",
        "share with sponsors",
        "share with researchers",
        "share with marketing partners",
        "share with social media platforms",
        "share with data brokers",
        "share with government agencies",
        "share with law enforcement",
        "share with regulators",
        "share with business partners",
        "share with subsidiaries",
        "share with joint venture partners",
        "share with third-party",
        "service providers",
        "share with advertisers"
    ],
    retention: [
        "retain",
        "keep your data",
        "data retention",
        "data storage",
        "how long we keep",
        "data we keep",
        "data we store",
        "data retention policy",
        "how long we retain",
        "how long we store",
        "data we retain",
        "data retention period",
        "how long we keep your data",
        "how long we retain your data",
        "how long we store your data",
        "data retention practices",
        "data storage practices",
        "data retention duration",
        "data storage duration",
        "data retention timeframe",
        "data storage timeframe",
        "data retention schedule",
        "data storage schedule",
        "data retention timeline",
        "data storage timeline",
        "data retention length",
        "data storage length",
        "how long we keep your information",
        "how long we retain your information",
        "how long we store your information",
        "information retention",
        "information storage",
        "information retention policy",
        "information storage policy"
    ],
    red_flags: [
        "biometric",
        "location",
        "track you",
        "sell your data",
        "share with third parties",
        "sell your information",
        "share with advertisers",
        "share with data brokers",
        "share with government agencies",
        "share with law enforcement",
        "share with regulators",
        "share with business partners",
        "share with affiliates",
        "share with subsidiaries",
        "share with joint venture partners",
        "share with service providers",
        "share with contractors",
        "share with vendors",
        "share with third-party service providers",
        "share with analytics providers",
        "share with sponsors",
        "share with researchers",
        "share with marketing partners",
        "share with social media platforms"
    ],
};

  sentences.forEach((sentence) => {
    const s = sentence.toLowerCase().trim();
    if (s.length < 20) return; // Ignore very short sentences

    if (keywords.collection.some((k) => s.includes(k)))
      summary.collection.add(sentence.trim());
    if (keywords.sharing.some((k) => s.includes(k)))
      summary.sharing.add(sentence.trim());
    if (keywords.retention.some((k) => s.includes(k)))
      summary.retention.add(sentence.trim());
    if (keywords.red_flags.some((k) => s.includes(k)))
      summary.red_flags.add(sentence.trim());
  });

  return summary;
}

/**
 * Injects and displays a modal with the policy summary.
 * @param {object} summary The summary object from generateSimpleSummary.
 * @param {string} sourceUrl The URL of the privacy policy.
 */
function showSummaryModal(summary, sourceUrl) {
  // Remove existing modal if any
  const oldModal = document.getElementById("dfm-summary-modal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "dfm-summary-modal";
  modal.style.cssText = `
        position: fixed; z-index: 99999; left: 0; top: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
    `;

  // Function to create list items from a set
  const createList = (pointSet) => {
    if (pointSet.size === 0) return "<li>No specific points found.</li>";
    return [...pointSet]
      .slice(0, 3)
      .map((p) => `<li>${p}.</li>`)
      .join("");
  };

  modal.innerHTML = `
        <style>
            #dfm-summary-content { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; background-color: #fff; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); animation: dfm-fadein 0.3s; }
            #dfm-summary-content h2 { font-size: 1.5rem; font-weight: bold; padding: 16px; border-bottom: 1px solid #eee; }
            #dfm-summary-content h3 { font-size: 1.1rem; font-weight: 600; margin-top: 16px; }
            #dfm-summary-content ul { list-style-type: disc; padding-left: 20px; margin-top: 8px; font-size: 0.9rem; }
            #dfm-summary-content .dfm-section { padding: 0 16px; }
            #dfm-summary-content .dfm-footer { padding: 16px; border-top: 1px solid #eee; text-align: right; }
            #dfm-close-modal { background-color: #3B82F6; color: white; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; }
            .dfm-red-flag { color: #D9534F; }
            @keyframes dfm-fadein { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        </style>
        <div id="dfm-summary-content">
            <h2>Privacy Policy Summary</h2>
            <div style="max-height: 60vh; overflow-y: auto;">
                <div class="dfm-section">
                    <h3>What data is collected:</h3>
                    <ul>${createList(summary.collection)}</ul>
                </div>
                <div class="dfm-section">
                    <h3>How it’s shared:</h3>
                    <ul>${createList(summary.sharing)}</ul>
                </div>
                <div class="dfm-section">
                    <h3>Data retention:</h3>
                    <ul>${createList(summary.retention)}</ul>
                </div>
                 <div class="dfm-section">
                    <h3 class="dfm-red-flag">Potential Red Flags:</h3>
                    <ul class="dfm-red-flag">${createList(
                      summary.red_flags
                    )}</ul>
                </div>
            </div>
            <div class="dfm-footer">
                <button id="dfm-close-modal">Close</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  document.getElementById("dfm-close-modal").addEventListener("click", () => {
    modal.remove();
  });
}

/**
 * Shows a temporary notification on the page.
 * @param {string} message The message to display.
 */
function showNotification(message) {
  const notification = document.createElement("div");
  notification.id = "dfm-notification";
  notification.style.cssText = `
        position: fixed; z-index: 99999; top: 20px; right: 20px; background-color: #2D3748; color: white;
        padding: 16px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 1rem;
        animation: dfm-slidein 0.5s;
    `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}
