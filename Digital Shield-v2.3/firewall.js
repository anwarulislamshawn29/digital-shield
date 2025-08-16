// file: firewall.js

document.addEventListener('DOMContentLoaded', () => {
    const siteHeader = document.getElementById('current-site-header');
    const firstPartyList = document.getElementById('first-party-list');
    const thirdPartyList = document.getElementById('third-party-list');
    
    // Blocklist elements
    const blocklistInput = document.getElementById('blocklist-input');
    const blocklistAddBtn = document.getElementById('blocklist-add-btn');
    const blocklistList = document.getElementById('blocklist-list');

    // --- NEW: Allow List Elements ---
    const allowListModeToggle = document.getElementById('allow-list-mode-enabled');
    const allowListControls = document.getElementById('allow-list-controls');
    const allowlistInput = document.getElementById('allowlist-input');
    const allowlistAddBtn = document.getElementById('allowlist-add-btn');
    const allowlistList = document.getElementById('allowlist-list');

    const contentFilters = {
        blockScripts: document.getElementById('block-scripts'),
        blockWebRTC: document.getElementById('block-webrtc'),
    };

    let currentTabId = null;
    let customRules = {};
    let isAllowListModeEnabled = false;

    // --- CORE FUNCTIONS ---

    const loadAndApplyState = async () => {
        const settings = await chrome.storage.sync.get(['firewallContentFilters', 'firewallCustomRules', 'isAllowListModeEnabled']);
        customRules = settings.firewallCustomRules || { globalBlock: [], globalAllow: [], firewallAllowlist: [] };
        isAllowListModeEnabled = settings.isAllowListModeEnabled || false;

        allowListModeToggle.checked = isAllowListModeEnabled;
        allowListControls.style.display = isAllowListModeEnabled ? 'block' : 'none';

        const activeFilters = settings.firewallContentFilters || {};
        for (const key in contentFilters) {
            if (contentFilters[key]) {
                contentFilters[key].checked = !!activeFilters[key];
            }
        }
        
        renderBlocklist();
        renderAllowlist(); // New function call
        fetchAndRenderConnections();
    };

    const saveAndApplyRules = () => {
        const activeFilters = {};
        for (const key in contentFilters) {
            if (contentFilters[key]) {
                activeFilters[key] = contentFilters[key].checked;
            }
        }
        chrome.storage.sync.set({
            firewallContentFilters: activeFilters,
            firewallCustomRules: customRules,
            isAllowListModeEnabled: isAllowListModeEnabled
        }, () => {
            chrome.runtime.sendMessage({ action: 'updateFirewallRules' });
        });
    };

    const fetchAndRenderConnections = () => {
        if (currentTabId === null) return;
        chrome.runtime.sendMessage({ action: 'getConnectionsForTab', tabId: currentTabId }, (response) => {
            if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return; }
            if (response) { renderConnections(response); }
        });
    };

    const renderConnections = (connections) => {
        firstPartyList.innerHTML = '<li class="connection-item empty-list-item">No first-party connections detected.</li>';
        thirdPartyList.innerHTML = '<li class="connection-item empty-list-item">No third-party connections detected.</li>';
        
        if (connections.firstParty && connections.firstParty.length > 0) {
            firstPartyList.innerHTML = '';
            connections.firstParty.forEach(domain => firstPartyList.appendChild(createConnectionItem(domain, 'firstParty')));
        }
        if (connections.thirdParty && connections.thirdParty.length > 0) {
            thirdPartyList.innerHTML = '';
            connections.thirdParty.forEach(domain => thirdPartyList.appendChild(createConnectionItem(domain, 'thirdParty')));
        }
    };

    const createConnectionItem = (domain, type) => {
        const item = document.createElement('li');
        item.className = 'connection-item';
        let actionsHtml = '';

        if (type === 'firstParty') {
            actionsHtml = `<div class="status-indicator"><span class="dot"></span><span>Allowed</span></div>`;
        } else {
            const isGloballyAllowed = customRules.globalAllow.includes(domain);
            const isGloballyBlocked = customRules.globalBlock.includes(domain);
            const isChecked = isGloballyAllowed || !isGloballyBlocked;
            actionsHtml = `<div class="connection-actions"><input type="checkbox" id="toggle-${domain}" class="toggle-checkbox" ${isChecked ? 'checked' : ''}><label for="toggle-${domain}" class="toggle-switch"></label></div>`;
        }
        
        item.innerHTML = `<span class="domain-name">${domain}</span>${actionsHtml}`;
        
        if (type === 'thirdParty') {
            const checkbox = item.querySelector('.toggle-checkbox');
            checkbox.addEventListener('change', () => { handleDomainToggle(domain, checkbox.checked); });
        }
        return item;
    };
    
    const handleDomainToggle = (domain, isAllowed) => {
        customRules.globalAllow = customRules.globalAllow.filter(d => d !== domain);
        customRules.globalBlock = customRules.globalBlock.filter(d => d !== domain);
        if (isAllowed) { customRules.globalAllow.push(domain); } else { customRules.globalBlock.push(domain); }
        saveAndApplyRules();
    };

    // --- Blocklist & Allowlist Management ---
    const renderBlocklist = () => {
        renderList(blocklistList, customRules.globalBlock, "No domains on blocklist.");
    };

    const renderAllowlist = () => {
        renderList(allowlistList, customRules.firewallAllowlist, "Allow list is empty.");
    };

    const renderList = (listElement, domains, emptyMessage) => {
        listElement.innerHTML = '';
        if (!domains || domains.length === 0) {
            listElement.innerHTML = `<li class="connection-item empty-list-item">${emptyMessage}</li>`;
            return;
        }
        domains.forEach(domain => {
            const item = document.createElement('li');
            item.className = 'connection-item';
            item.innerHTML = `
                <span class="domain-name">${domain}</span>
                <button class="remove-btn" data-domain="${domain}" title="Remove ${domain}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
            listElement.appendChild(item);
        });
    };

    const addDomainToList = (domain, listName) => {
        if (domain && !customRules[listName].includes(domain)) {
            customRules[listName].push(domain);
            saveAndApplyRules();
            if (listName === 'globalBlock') renderBlocklist();
            if (listName === 'firewallAllowlist') renderAllowlist();
        }
    };

    const removeDomainFromList = (domain, listName) => {
        customRules[listName] = customRules[listName].filter(d => d !== domain);
        saveAndApplyRules();
        if (listName === 'globalBlock') renderBlocklist();
        if (listName === 'firewallAllowlist') renderAllowlist();
    };

    const handleAddDomain = (inputElement, listName) => {
        let domain = inputElement.value.trim().toLowerCase();
        if (!domain) return;
        try { domain = new URL("http://" + domain.replace(/^https?:\/\//, '')).hostname.replace(/^www\./, ''); } 
        catch (e) { console.error("Invalid domain format"); return; }
        addDomainToList(domain, listName);
        inputElement.value = '';
    };

    // --- EVENT LISTENERS ---
    blocklistAddBtn.addEventListener('click', () => handleAddDomain(blocklistInput, 'globalBlock'));
    allowlistAddBtn.addEventListener('click', () => handleAddDomain(allowlistInput, 'firewallAllowlist'));
    
    blocklistList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) { removeDomainFromList(removeBtn.dataset.domain, 'globalBlock'); }
    });

    allowlistList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) { removeDomainFromList(removeBtn.dataset.domain, 'firewallAllowlist'); }
    });

    allowListModeToggle.addEventListener('change', () => {
        isAllowListModeEnabled = allowListModeToggle.checked;
        allowListControls.style.display = isAllowListModeEnabled ? 'block' : 'none';
        saveAndApplyRules();
    });

    for (const key in contentFilters) {
        const checkbox = contentFilters[key];
        if (checkbox) { checkbox.addEventListener('change', saveAndApplyRules); }
    }

    // --- INITIALIZATION ---
    const init = async () => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            currentTabId = tabs[0].id;
            try {
                const url = new URL(tabs[0].url);
                siteHeader.textContent = `Connections for: ${url.hostname}`;
            } catch (e) { siteHeader.textContent = 'Viewing a local or invalid page'; }
        }
        loadAndApplyState();
    };

    init();
});
