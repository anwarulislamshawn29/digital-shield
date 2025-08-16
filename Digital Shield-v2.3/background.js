// file: background.js
// --- DATA STRUCTURES ---
const whatsNewUrl = "whats-new.html"; // Or a local page like 'whats-new.html'
const LATEST_VERSION = "2.0"; // The version you are updating to
const tabConnections = {}; // In-memory cache for speed
let tabTrackers = {};

if (typeof importScripts !== 'undefined') {
  importScripts('browser-polyfill.js');
}


// --- Helper Function to Hash PIN ---
async function hashText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
// --- Tab Locking Logic ---
async function lockTab(tabId) {
    try {
        // Check if tab exists before trying to inject scripts
        await chrome.tabs.get(tabId);

        // Inject the CSS first
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ['tab_locker.css']
        });
        // Then inject the JS
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['tab_locker.js']
        });
    } catch (e) {
        console.log(`Could not lock tab ${tabId} as it may have been closed.`, e);
    }
}

async function unlockTab(tabId) {
    const { lockedTabs = [] } = await chrome.storage.local.get('lockedTabs');
    const updatedLockedTabs = lockedTabs.filter(id => id !== tabId);
    await chrome.storage.local.set({ lockedTabs: updatedLockedTabs });
}
// MODIFIED: This function now updates the footprint for a specific tab
async function updateFootprint(tabId, initiatorDomain, trackerInfo) {
    const key = `footprint_${tabId}`;
    const data = await chrome.storage.local.get(key);
    const tabFootprint = data[key] || { nodes: [], links: [] };

    // Use the initiator domain as the central node for this tab's graph
    if (!tabFootprint.nodes.some(n => n.id === initiatorDomain)) {
        tabFootprint.nodes.push({ id: initiatorDomain, label: initiatorDomain, type: 'website' });
    }

    // Add tracker node if it doesn't exist
    if (!tabFootprint.nodes.some(n => n.id === trackerInfo.name)) {
        tabFootprint.nodes.push({ id: trackerInfo.name, label: trackerInfo.name, type: 'tracker' });
    }

    // Link website to the tracker
    const linkExists = tabFootprint.links.some(l => l.source === initiatorDomain && l.target === trackerInfo.name);
    if (!linkExists) {
        tabFootprint.links.push({ source: initiatorDomain, target: trackerInfo.name });
    }

    await chrome.storage.local.set({ [key]: tabFootprint });
}


// --- News Fetching Logic ---
const NEWS_SOURCE_URL = 'https://www.bleepingcomputer.com/feed/';
const MOCK_NEWS = [
  "Privacy Tip: Use a password manager to create strong, unique passwords.",
  "Facebook fined $1.2B for privacy violations in massive data leak.",
  "New Chrome settings can improve your privacy by 20%.",
  "Report: Data brokers are selling location data of millions.",
];

function simpleRssParser(rssText) {
    const headlines = [];
    const items = rssText.split('<item>');
    items.shift();
    for (const item of items) {
        const titleStart = item.indexOf('<title>') + '<title>'.length;
        const titleEnd = item.indexOf('</title>');
        if (titleStart > -1 && titleEnd > -1) {
            const headline = item.substring(titleStart, titleEnd)
                               .replace('<![CDATA[', '')
                               .replace(']]>', '')
                               .trim();
            headlines.push(headline);
        }
    }
    return headlines.slice(0, 10);
}


chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
   if (reason === 'install') {
        // Set the installation date for the review prompt feature
        chrome.storage.sync.set({ installDate: Date.now() });
        
        // // Initialize firewall settings on first install
        chrome.storage.sync.set({
            firewallContentFilters: { blockScripts: false, blockWebRTC: false },
            firewallCustomRules: { globalBlock: [], globalAllow: [], firewallAllowlist: [] },
            isAllowListModeEnabled: false,
            firewallBlockMessage: 'This site, {domain}, has been blocked by your Digital Shield firewall settings.'
        });
        console.log("Digital Shield Firewall initialized.");
    }
    // Check if the reason is "update"
  if (reason === 'update') {
    // Open the "What's New" page
    await chrome.tabs.create({
      url: whatsNewUrl
    });

    // // Example of showing a notification as well
    // await chrome.notifications.create('update-notification', {
    //   type: 'basic',
    //   title: 'Extension Updated!',
    //   message: `Digital Shield has been updated to version ${LATEST_VERSION}.`,
    //   iconUrl: 'images/icon-128.png' // Path to your extension's icon
    // });
  }
});
// --- FIREWALL INITIALIZATION ---
chrome.runtime.onInstalled.addListener(() => {
    
    chrome.storage.sync.set({
        firewallContentFilters: { blockScripts: false, blockWebRTC: false },
        firewallCustomRules: { globalBlock: [], globalAllow: [], firewallAllowlist: [] },
        isAllowListModeEnabled: false,
        firewallBlockMessage: 'This site, {domain}, has been blocked by your Digital Shield firewall settings.'
    });
    console.log("Digital Shield Firewall initialized.");
});

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.tabId < 0) return;
        try {
            const url = new URL(details.url);
            const initiator = details.initiator ? new URL(details.initiator).hostname.replace(/^www\./, '') : null;
            if (!initiator) return;

            // Connection Tracking
            if (!tabConnections[details.tabId]) tabConnections[details.tabId] = { firstParty: new Set(), thirdParty: new Set() };
            if (url.hostname.endsWith(initiator)) tabConnections[details.tabId].firstParty.add(url.hostname);
            else tabConnections[details.tabId].thirdParty.add(url.hostname);

            // Tracker Detection
            for (const trackerDomain in trackers) {
                if (url.hostname.includes(trackerDomain)) {
                    if (!tabTrackers[details.tabId]) tabTrackers[details.tabId] = {};
                    const trackerInfo = trackers[trackerDomain];
                    if (!tabTrackers[details.tabId][trackerInfo.name]) {
                        tabTrackers[details.tabId][trackerInfo.name] = trackerInfo;
                        updateStorage(details.tabId);
                        updateBadge(details.tabId);
                        // MODIFIED: Pass the tabId to the updateFootprint function
                        updateFootprint(details.tabId, initiator, trackerInfo);
                    }
                }
            }
        } catch (e) {}
    },
    { urls: ["<all_urls>"] }
);

chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabConnections[tabId];
});

async function updateFirewallRules() {
    let { 
        firewallContentFilters, 
        firewallCustomRules,
        isAllowListModeEnabled
    } = await chrome.storage.sync.get(['firewallContentFilters', 'firewallCustomRules', 'isAllowListModeEnabled']);

    firewallContentFilters = firewallContentFilters || {};
    firewallCustomRules = firewallCustomRules || {};
    isAllowListModeEnabled = isAllowListModeEnabled || false;

    const rulesToAdd = [];
    let ruleIdCounter = 1;
    const allResourceTypes = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"];

    if (isAllowListModeEnabled) {
        // --- ALLOW LIST MODE ---
        // 1. Block everything by default with a low priority rule.
        rulesToAdd.push({
            id: ruleIdCounter++,
            priority: 1,
            action: { type: 'block' },
            condition: { urlFilter: "*://*/*", resourceTypes: allResourceTypes }
        });
        // 2. Add high-priority ALLOW rules for domains in the allow list.
        if (firewallCustomRules.firewallAllowlist && firewallCustomRules.firewallAllowlist.length > 0) {
            rulesToAdd.push({
                id: ruleIdCounter++,
                priority: 2,
                action: { type: 'allow' },
                condition: { requestDomains: firewallCustomRules.firewallAllowlist, resourceTypes: allResourceTypes }
            });
        }
    } else {
        // --- BLOCK LIST MODE (Standard operation) ---
        if (firewallContentFilters.blockScripts) {
             rulesToAdd.push({
                id: ruleIdCounter++, priority: 2, action: { type: 'block' },
                condition: { resourceTypes: ["script"], domainType: 'thirdParty' }
            });
        }
        if (firewallContentFilters.blockWebRTC) {
             rulesToAdd.push({
                id: ruleIdCounter++, priority: 2, action: { type: 'block' },
                condition: { urlFilter: "*://*/*?*webrtc*" }
            });
        }
        if (firewallCustomRules.globalAllow && firewallCustomRules.globalAllow.length > 0) {
            rulesToAdd.push({
                id: ruleIdCounter++, priority: 10, action: { type: 'allow' },
                condition: { requestDomains: firewallCustomRules.globalAllow, resourceTypes: allResourceTypes }
            });
        }
        if (firewallCustomRules.globalBlock && firewallCustomRules.globalBlock.length > 0) {
            rulesToAdd.push({
                id: ruleIdCounter++, 
                priority: 5, 
                action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' }},
                condition: { requestDomains: firewallCustomRules.globalBlock, resourceTypes: ["main_frame"] }
            });
            rulesToAdd.push({
                id: ruleIdCounter++, priority: 5, action: { type: 'block' },
                condition: { requestDomains: firewallCustomRules.globalBlock, resourceTypes: ["sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"] }
            });
        }
    }

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: rulesToAdd
    });

    console.log("Firewall rules updated. Mode:", isAllowListModeEnabled ? "ALLOW" : "BLOCK", "Rules active:", rulesToAdd.length);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
     if (sender.origin && sender.origin !== `chrome-extension://${browser.runtime.id}` && sender.origin !== `moz-extension://${browser.runtime.id.slice(1,-1)}`) {
        return true;
    }
   else if (request.action === 'toggle_feature') {
        toggleFeatureRuleset(request.feature, request.enabled);
    } else if (request.action === 'hide_element') {
        // This is where you would save the hidden element's selector to storage
    } else if (request.action === 'update_blocking_persona') {
        updateBlockingPersona(request.persona);
    } else if (request.action === 'verifyGumroadLicense') {
        verifyGumroadLicense(request.licenseKey).then(sendResponse);
        return true;
    } else if (request.action === 'toggle_sandbox') {
        updateSandboxMode(request.enabled);
    }
    else  if (request.action === 'lock_tab') {
        const tabId = request.tabId;
        chrome.storage.local.get('lockedTabs', (data) => {
            const lockedTabs = data.lockedTabs || [];
            if (!lockedTabs.includes(tabId)) {
                lockedTabs.push(tabId);
                chrome.storage.local.set({ lockedTabs }, () => {
                    lockTab(tabId);
                    sendResponse({ success: true });
                });
            }
        });
        return true; // Indicates async response
    }
    else if (request.action === 'verify_pin_for_unlock') {
        chrome.storage.sync.get('securityPin', async (data) => {
            if (data.securityPin && data.securityPin === request.hashedPin) {
                await unlockTab(sender.tab.id);
                sendResponse({ unlocked: true });
            } else {
                sendResponse({ unlocked: false });
            }
        });
        return true; // Indicates async response
    }
   else if(request.action === 'get_footprint_data'){
         const key = `footprint_${request.tabId}`;
            chrome.storage.local.get(key).then(data => sendResponse(data[key]));
            return true;
    }
   else  if(request.action === 'clear_footprint_data'){
        const clearKey = `footprint_${request.tabId}`;
            chrome.storage.local.set({ [clearKey]: { nodes: [], links: [] } }, () => sendResponse({ success: true }));
            return true;
    }
   else if (request.action === 'getConnectionsForTab') {
        const connections = tabConnections[request.tabId] || { firstParty: new Set(), thirdParty: new Set() };
        sendResponse({
            firstParty: Array.from(connections.firstParty),
            thirdParty: Array.from(connections.thirdParty)
        });
    } else if (request.action === 'updateFirewallRules') {
        updateFirewallRules();
        sendResponse({ success: true });
    }
    else if (request.action === 'check_pwned_password') {
        checkPwnedPassword(request.password).then(sendResponse);
        return true; // Indicates async response
    }
    
    return true; 
});

chrome.webRequest.onBeforeRedirect.addListener(
    (details) => {
        if (details.redirectUrl.includes('blocked.html')) {
            const url = new URL(details.url);
            const newRedirectUrl = `${details.redirectUrl}?domain=${url.hostname}`;
            chrome.tabs.update(details.tabId, { url: newRedirectUrl });
        }
    },
    { urls: ["<all_urls>"], types: ["main_frame"] }
);

updateFirewallRules();

async function fetchPrivacyNews() {
  console.log("Digital Shield: Fetching privacy news...");
  try {
    const response = await fetch(NEWS_SOURCE_URL, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rssText = await response.text();
    const headlines = simpleRssParser(rssText);

    if (headlines && headlines.length > 0) {
        await browser.storage.local.set({ privacyNews: headlines });
        console.log("Digital Shield: Privacy news updated from live feed.");
    } else {
        throw new Error("Live feed parsing returned no headlines.");
    }
  } catch (error) {
    console.error("Digital Shield: Failed to fetch live news, using fallback data.", error);
    await browser.storage.local.set({ privacyNews: MOCK_NEWS });
  }
}

// --- Pwned Passwords Check (k-Anonymity) ---
async function checkPwnedPassword(password) {
    try {
        // 1. Hash the password using SHA-1 with the built-in Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        
        // Convert the buffer to a hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        // 2. Split the hash into prefix (5 chars) and suffix
        const prefix = hexHash.substring(0, 5);
        const suffix = hexHash.substring(5);

        // 3. Query the k-Anonymity API with the prefix
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        
        if (!response.ok) {
            throw new Error(`Pwned Passwords API error: ${response.status}`);
        }
        
        const text = await response.text();
        
        // 4. Check the list of returned suffixes for a match
        const hashes = text.split('\r\n');
        for (const line of hashes) {
            const [hashSuffix, countStr] = line.split(':');
            if (hashSuffix === suffix) {
                // Found it! The password is pwned.
                return { success: true, isPwned: true, count: parseInt(countStr, 10) };
            }
        }

        // 5. If no match is found after checking all suffixes
        return { success: true, isPwned: false };

    } catch (error) {
        console.error("Digital Shield: Pwned Password check failed.", error);
        return { success: false, error: error.message };
    }
}


// --- Event Listeners ---
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     // ... (keep existing message listeners)
    
//     if (request.action === 'check_pwned_password') {
//         checkPwnedPassword(request.password).then(sendResponse);
//         return true; // Indicates async response
//     }
    
//     return true; // Keep this for other async listeners
// });

// --- Feature Control Logic ---
const FEATURE_RULESETS = {
    httpsUpgrade: 'ruleset_https_upgrade',
    maliciousSiteProtection: 'ruleset_malicious',
    fingerprintProtection: 'ruleset_fingerprinting',
    utmStripping: 'ruleset_utm_stripping'
};

const PERSONA_RULESETS = {
    'balanced': 'ruleset_balanced',
    'max-security': 'ruleset_max_security',
    'work-mode': 'ruleset_work_mode'
};

async function toggleFeatureRuleset(feature, enable) {
    const rulesetId = FEATURE_RULESETS[feature];
    if (!rulesetId) return;
    try {
        if (enable) {
            await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: [rulesetId] });
            console.log(`Digital Shield: ${feature} ENABLED.`);
        } else {
            await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: [rulesetId] });
            console.log(`Digital Shield: ${feature} DISABLED.`);
        }
    } catch (error) {
        console.error(`Error updating ${feature}:`, error);
    }
}

async function updateBlockingPersona(personaId) {
   const allRulesetIds = Object.values(PERSONA_RULESETS);
    const enabledRulesetId = PERSONA_RULESETS[personaId] || PERSONA_RULESETS['balanced'];
    try {
        await browser.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: allRulesetIds.filter(id => id !== enabledRulesetId),
            enableRulesetIds: [enabledRulesetId]
        });
    } catch (error) {
        console.error("Error updating blocking persona:", error);
    }
}

async function updateSandboxMode(enable) {
     try {
        if (enable) {
            await browser.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['ruleset_sandbox'] });
            console.log("Digital Shield: Privacy Sandbox ENABLED.");
        } else {
            await browser.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ['ruleset_sandbox'] });
            console.log("Digital Shield: Privacy Sandbox DISABLED.");
        }
    } catch (error) {
        console.error("Error updating sandbox mode:", error);
    }
}

// --- Event Listeners ---
const onAppStart = () => {
   browser.storage.sync.get(Object.keys(FEATURE_RULESETS), (settings) => {
        for (const [feature, enabled] of Object.entries(settings)) {
            toggleFeatureRuleset(feature, !!enabled);
        }
    });
    browser.storage.sync.get(['blockingPersona', 'sandboxMode'], (data) => {
        updateBlockingPersona(data.blockingPersona || 'balanced');
        updateSandboxMode(!!data.sandboxMode);
    });
    fetchPrivacyNews();
    browser.alarms.create('fetch-news-alarm', {
      delayInMinutes: 1,
      periodInMinutes: 240
    });
};

browser.runtime.onStartup.addListener(onAppStart);
browser.runtime.onInstalled.addListener((details) => {
    onAppStart();

    // NEW: Open registration page on first install
    if (details.reason === 'install') {
        browser.tabs.create({
            url: 'registration.html'
        });
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetch-news-alarm') {
    fetchPrivacyNews();
  }
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//      if (sender.origin && sender.origin !== `chrome-extension://${browser.runtime.id}` && sender.origin !== `moz-extension://${browser.runtime.id.slice(1,-1)}`) {
//         return true;
//     }
//     if (request.action === 'toggle_feature') {
//         toggleFeatureRuleset(request.feature, request.enabled);
//     } else if (request.action === 'hide_element') {
//         // This is where you would save the hidden element's selector to storage
//     } else if (request.action === 'update_blocking_persona') {
//         updateBlockingPersona(request.persona);
//     } else if (request.action === 'verifyGumroadLicense') {
//         verifyGumroadLicense(request.licenseKey).then(sendResponse);
//         return true;
//     } else if (request.action === 'toggle_sandbox') {
//         updateSandboxMode(request.enabled);
//     }
//     return true;
// });

// --- Tracker Detection Logic (for UI display only) ---
const trackers = {
    "google-analytics.com": { name: "Google Analytics", category: "Analytics", risk: "Low" },
    "googletagmanager.com": { name: "Google Tag Manager", category: "Analytics", risk: "Low" },
    "connect.facebook.net": { name: "Facebook Pixel", category: "Advertising", risk: "High" },
    "scorecardresearch.com": { name: "Scorecard Research", category: "Analytics", risk: "Medium" },
    "doubleclick.net": { name: "DoubleClick", category: "Advertising", risk: "High" },
    "hotjar.com": { name: "Hotjar", category: "Analytics", risk: "Medium" },
    "adnxs.com": { name: "AppNexus", category: "Advertising", risk: "High" },
    "criteo.com": { name: "Criteo", category: "Advertising", risk: "High" },
    "quantserve.com": { name: "Quantcast", category: "Analytics", risk: "Medium" },
    "bluekai.com": { name: "BlueKai", category: "Advertising", risk: "High" },
    "rubiconproject.com": { name: "Rubicon Project", category: "Advertising", risk: "High" },
    "openx.net": { name: "OpenX", category: "Advertising", risk: "High" },
    "mathtag.com": { name: "MediaMath", category: "Advertising", risk: "High" },
    "adform.net": { name: "Adform", category: "Advertising", risk: "High" },
    "yieldmo.com": { name: "Yieldmo", category: "Advertising", risk: "Medium" },
    "casalemedia.com": { name: "Casale Media", category: "Advertising", risk: "Medium" },
    "bidswitch.net": { name: "BidSwitch", category: "Advertising", risk: "Medium" },
    "pubmatic.com": { name: "PubMatic", category: "Advertising", risk: "High" },
    "everesttech.net": { name: "Adobe Audience Manager", category: "Analytics", risk: "Medium" },
    "adroll.com": { name: "AdRoll", category: "Advertising", risk: "High" },
    "taboola.com": { name: "Taboola", category: "Advertising", risk: "Medium" },
    "outbrain.com": { name: "Outbrain", category: "Advertising", risk: "Medium" },
    "moatads.com": { name: "Moat", category: "Analytics", risk: "Medium" },
    "optimizely.com": { name: "Optimizely", category: "Analytics", risk: "Low" },
    "newrelic.com": { name: "New Relic", category: "Analytics", risk: "Low" },
    "mixpanel.com": { name: "Mixpanel", category: "Analytics", risk: "Low" },
    "segment.com": { name: "Segment", category: "Analytics", risk: "Low" },
    "cloudflareinsights.com": { name: "Cloudflare Insights", category: "Analytics", risk: "Low" },
    "pingdom.net": { name: "Pingdom", category: "Analytics", risk: "Low" },
    "chartbeat.com": { name: "Chartbeat", category: "Analytics", risk: "Medium" },
    "smartadserver.com": { name: "Smart AdServer", category: "Advertising", risk: "Medium" },
    "trustarc.com": { name: "TrustArc", category: "Compliance", risk: "Low" },
    "truste.com": { name: "TRUSTe", category: "Compliance", risk: "Low" },
    "adobe.com": { name: "Adobe Analytics", category: "Analytics", risk: "Low" },
    "flashtalking.com": { name: "Flashtalking", category: "Advertising", risk: "Medium" },
    "ml314.com": { name: "Media Innovation Group", category: "Advertising", risk: "Medium" },
    "simpli.fi": { name: "Simpli.fi", category: "Advertising", risk: "Medium" },
    "serving-sys.com": { name: "Sizmek", category: "Advertising", risk: "Medium" },
    "adblade.com": { name: "Adblade", category: "Advertising", risk: "Medium" },
    "adzerk.net": { name: "Adzerk", category: "Advertising", risk: "Medium" },
    "tradedoubler.com": { name: "TradeDoubler", category: "Advertising", risk: "Medium" },
    "invitemedia.com": { name: "Invite Media", category: "Advertising", risk: "Medium" },
    "advertising.com": { name: "Advertising.com", category: "Advertising", risk: "High" },
    "exelator.com": { name: "Exelate", category: "Advertising", risk: "High" },
    "eyeota.net": { name: "Eyeota", category: "Advertising", risk: "Medium" },
    "liveramp.com": { name: "LiveRamp", category: "Advertising", risk: "High" },
    "mediamath.com": { name: "MediaMath", category: "Advertising", risk: "High" },
    "rocketfuel.com": { name: "Rocket Fuel", category: "Advertising", risk: "High" },
    "turn.com": { name: "Turn", category: "Advertising", risk: "High" },
    "zopim.com": { name: "Zopim", category: "Chat", risk: "Low" },
    "intercom.io": { name: "Intercom", category: "Chat", risk: "Low" },
    "liveperson.net": { name: "LivePerson", category: "Chat", risk: "Low" },
    "userlike.com": { name: "Userlike", category: "Chat", risk: "Low" },
    "olark.com": { name: "Olark", category: "Chat", risk: "Low" },
    "snapchat.com": { name: "Snapchat Pixel", category: "Advertising", risk: "High" },
    "atdmt.com": { name: "Atlas Solutions", category: "Advertising", risk: "High" },
    "adbrite.com": { name: "AdBrite", category: "Advertising", risk: "Medium" },
    "adcolony.com": { name: "AdColony", category: "Advertising", risk: "Medium" },
    "adition.com": { name: "ADITION", category: "Advertising", risk: "Medium" },
    "admeld.com": { name: "Admeld", category: "Advertising", risk: "Medium" },
    "adriver.ru": { name: "AdRiver", category: "Advertising", risk: "Medium" },
    "adscale.de": { name: "AdScale", category: "Advertising", risk: "Medium" },
    "adsrvr.org": { name: "The Trade Desk", category: "Advertising", risk: "High" },
    "adtech.de": { name: "AdTech", category: "Advertising", risk: "Medium" },
    "advertisingiq.com": { name: "Advertising IQ", category: "Advertising", risk: "Medium" },
    "amplitude.com": { name: "Amplitude", category: "Analytics", risk: "Low" },
    "appboy.com": { name: "Braze", category: "Analytics", risk: "Low" },
    "brightcove.com": { name: "Brightcove", category: "Analytics", risk: "Low" },
    "bugherd.com": { name: "BugHerd", category: "Analytics", risk: "Low" },
    "chartboost.com": { name: "Chartboost", category: "Advertising", risk: "Medium" },
    "clicktale.net": { name: "ClickTale", category: "Analytics", risk: "Medium" },
    "comscore.com": { name: "Comscore", category: "Analytics", risk: "Medium" },
    "conviva.com": { name: "Conviva", category: "Analytics", risk: "Medium" },
    "crazyegg.com": { name: "Crazy Egg", category: "Analytics", risk: "Medium" },
    "datalogix.com": { name: "Datalogix", category: "Advertising", risk: "High" },
    "demdex.net": { name: "Demdex", category: "Advertising", risk: "High" },
    "dotomi.com": { name: "Dotomi", category: "Advertising", risk: "Medium" },
    "drawbridge.com": { name: "Drawbridge", category: "Advertising", risk: "Medium" },
    "dyntrk.com": { name: "Dyntrk", category: "Advertising", risk: "Medium" },
    "ensighten.com": { name: "Ensighten", category: "Analytics", risk: "Low" },
    "etracker.com": { name: "eTracker", category: "Analytics", risk: "Low" },
    "facebook.com": { name: "Facebook", category: "Advertising", risk: "High" },
    "fastclick.net": { name: "FastClick", category: "Advertising", risk: "Medium" },
    "gemius.pl": { name: "Gemius", category: "Analytics", risk: "Medium" },
    "gigya.com": { name: "Gigya", category: "Analytics", risk: "Low" },
    "gstatic.com": { name: "Google Static", category: "Analytics", risk: "Low" },
    "insightexpressai.com": { name: "InsightExpress", category: "Advertising", credit: "Medium" },
    "kissmetrics.com": { name: "Kissmetrics", category: "Analytics", risk: "Low" },
    "krxd.net": { name: "Krux Digital", category: "Advertising", risk: "High" },
    "leadforensics.com": { name: "Lead Forensics", category: "Analytics", risk: "Medium" },
    "linkedin.com": { name: "LinkedIn Insights", category: "Advertising", risk: "Medium" },
    "lotame.com": { name: "Lotame", category: "Advertising", risk: "High" },
    "moat.com": { name: "Moat", category: "Analytics", risk: "Medium" },
    "nielsen.com": { name: "Nielsen", category: "Analytics", risk: "Medium" },
    "omtrdc.net": { name: "Adobe Omniture", category: "Analytics", risk: "Low" },
    "pardot.com": { name: "Pardot", category: "Analytics", risk: "Low" },
    "perfectaudience.com": { name: "Perfect Audience", category: "Advertising", risk: "Medium" },
    "revcontent.com": { name: "Revcontent", category: "Advertising", risk: "Medium" },
    "sascdn.com": { name: "SAS", category: "Advertising", risk: "Medium" },
    "sharethis.com": { name: "ShareThis", category: "Analytics", risk: "Low" },
    "sizmek.com": { name: "Sizmek", category: "Advertising", risk: "Medium" },
    "statcounter.com": { name: "StatCounter", category: "Analytics", risk: "Low" },
    "steelhouse.com": { name: "SteelHouse", category: "Advertising", risk: "Medium" },
    "tapad.com": { name: "Tapad", category: "Advertising", risk: "Medium" },
    "teads.tv": { name: "Teads", category: "Advertising", risk: "Medium" },
    "trafficjunky.net": { name: "TrafficJunky", category: "Advertising", risk: "Medium" },
    "trustpilot.com": { name: "Trustpilot", category: "Analytics", risk: "Low" },
    "turnto.com": { name: "TurnTo", category: "Analytics", risk: "Low" },
    "twitter.com": { name: "Twitter Ads", category: "Advertising", risk: "High" },
    "webtrends.com": { name: "Webtrends", category: "Analytics", risk: "Low" },
    "yahoo.com": { name: "Yahoo Analytics", category: "Analytics", risk: "Medium" },
    "yandex.ru": { name: "Yandex Metrica", category: "Analytics", risk: "Medium" },
    "yieldlab.net": { name: "Yieldlab", category: "Advertising", risk: "Medium" },
    "zemanta.com": { name: "Zemanta", category: "Advertising", risk: "Medium" },
    "adservice.google.com": { name: "Google Ads", category: "Advertising", risk: "High" },
    "googlesyndication.com": { name: "Google Syndication", category: "Advertising", risk: "High" }
};

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
         try {
        const url = new URL(details.url);
         const initiator = details.initiator ? new URL(details.initiator).hostname.replace(/^www\./, '') : null;
            if (!initiator) return;
               // Connection Tracking
        if (!tabConnections[details.tabId]) tabConnections[details.tabId] = { firstParty: new Set(), thirdParty: new Set() };
            if (url.hostname.endsWith(initiator)) tabConnections[details.tabId].firstParty.add(url.hostname);
            else tabConnections[details.tabId].thirdParty.add(url.hostname);
        for (const trackerDomain in trackers) {
            if (url.hostname.includes(trackerDomain)) {
                const tabId = details.tabId;
                if (tabId < 0) return;
                if (!tabTrackers[tabId]) tabTrackers[tabId] = {};
                const trackerInfo = trackers[trackerDomain];
                if (!tabTrackers[tabId][trackerInfo.name]) {
                     tabTrackers[tabId][trackerInfo.name] = trackerInfo;
                     chrome.runtime.sendMessage({
                         action: 'tracker_blocked',
                         tracker: trackerInfo,
                         tabId: tabId
                     }).catch(e => {});
                     updateStorage(tabId);
                     updateBadge(tabId);
                    updateFootprint(initiator, trackerInfo);
                }
            }
        }
     } catch (e) {}
    },
    { urls: ["<all_urls>"] }
);

// Re-lock tabs when they are updated (e.g., refreshed)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading') {
        tabTrackers[tabId] = {};
        updateStorage(tabId);
        updateBadge(tabId);
        // MODIFIED: Clear the footprint for the tab when it reloads
        const key = `footprint_${tabId}`;
        chrome.storage.local.set({ [key]: { nodes: [], links: [] } });
        chrome.storage.local.get({ lockedTabs: [] }, (data) => {
            if (data.lockedTabs.includes(tabId)) lockTab(tabId);
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabTrackers[tabId];
    delete tabConnections[tabId];
    chrome.storage.local.remove(tabId.toString());
    // MODIFIED: Also remove the footprint data for the closed tab
    chrome.storage.local.remove(`footprint_${tabId}`);
    unlockTab(tabId);
});


function updateStorage(tabId) {
    chrome.storage.local.get(tabId.toString(), (result) => {
        const existingData = result[tabId.toString()] || {};
        const data = {
            trackers: Object.values(tabTrackers[tabId] || {}),
            timestamp: new Date().toISOString()
        };
        chrome.storage.local.set({ [tabId.toString()]: data });
    });
}

function updateBadge(tabId) {
    const count = tabTrackers[tabId] ? Object.keys(tabTrackers[tabId]).length : 0;
    chrome.action.setBadgeText({
        text: count > 0 ? count.toString() : '',
        tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
        color: '#EF4444',
        tabId: tabId
    });
}

// --- Gumroad License Verification ---
async function verifyGumroadLicense(licenseKey) {
    const GUMROAD_PRODUCT_ID = '6n5BmUkoAJjaGgYQb5PcKg==';
    if (!GUMROAD_PRODUCT_ID) {
        console.error("Digital Shield: Product ID is not set. Cannot verify license.");
        return { success: false, error: 'Extension not configured for activation.' };
    }
    try {
        const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: GUMROAD_PRODUCT_ID,
                license_key: licenseKey.trim()
            })
        });
        const data = await response.json();
        if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
            await browser.storage.sync.set({ isPremium: true });
            browser.tabs.create({ url: browser.runtime.getURL('thank_you.html') });
            return { success: true };
        } else {
            const errorMessage = data.message || 'Invalid license key.';
            browser.tabs.create({ url: browser.runtime.getURL(`payment_failed.html?error=${encodeURIComponent(errorMessage)}`) });
            return { success: false, error: errorMessage };
        }
    } catch (error) {
        const networkError = 'Could not connect to the activation server.';
        browser.tabs.create({ url: browser.runtime.getURL(`payment_failed.html?error=${encodeURIComponent(networkError)}`) });
        return { success: false, error: networkError };
    }
}