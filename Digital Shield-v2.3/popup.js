// file: popup.js

document.addEventListener("DOMContentLoaded", function () {
  try {
    // --- Element References ---
    const proBadge = document.querySelector(".pro-badge");
    const settingsLink = document.getElementById("settings-link");
    const dashboardLink = document.getElementById("dashboard-link");
    const destroyCookiesBtn = document.getElementById("destroy-cookies");
    const clearCacheBtn = document.getElementById("clear-cache-btn");
    const summarizeBtn = document.getElementById("summarize-policy");
    const requestBtn = document.getElementById("send-request");
    const privacyArcadeBtn = document.getElementById("privacy-arcade-btn");
    const trackerListEl = document.getElementById("tracker-list");
    const trackersCountEl = document.getElementById("trackers-detected-count");
    const fontToggleBtn = document.getElementById("font-toggle");
    const themeToggleBtn = document.getElementById("theme-toggle");
    const newsTickerContainer = document.getElementById(
      "news-ticker-container"
    );
    const dnsInfoBtn = document.getElementById('dns-info-btn'); // New button
    const newsContent = newsTickerContainer
      ? newsTickerContainer.querySelector(".news-content")
      : null;
    const dateBadge = document.getElementById("date-badge");
    const footprintHeader = document.getElementById("footprint-header");

    // Modal References
    const cacheClearedModal = document.getElementById("cache-cleared-modal");
    const cacheTimestampEl = document.getElementById("cache-cleared-timestamp");
    const cookiesDestroyedModal = document.getElementById(
      "cookies-destroyed-modal"
    );
    const cookiesDestroyedMessageEl = document.getElementById(
      "cookies-destroyed-message"
    );
    const cookiesDestroyedTimestampEl = document.getElementById(
      "cookies-destroyed-timestamp"
    );
    const cleanShareModal = document.getElementById("clean-share-modal");
    const privacyCoachModal = document.getElementById("privacy-coach-modal");
    const privacyTipTitle = document.getElementById("privacy-tip-title");
    const privacyTipContent = document.getElementById("privacy-tip-content");
    const notesBtn = document.getElementById("tool-notes");
    const passwordManagerBtn = document.getElementById("password-manager");

    // NEW Button References
    const privacyCoachBtn = document.getElementById("privacy-coach-btn");
    const cleanShareBtn = document.getElementById("clean-share-btn");
    const readingViewBtn = document.getElementById("reading-view-btn");
    const tabLockBtn = document.getElementById("tab-lock-btn"); // New button
    const tabLockedModal = document.getElementById("tab-locked-modal");
    // Review Prompt Elements
    const reviewModal = document.getElementById("review-prompt-modal");
    const rateNowBtn = document.getElementById("rate-now-btn");
    const remindLaterBtn = document.getElementById("remind-later-btn");
    const noThanksBtn = document.getElementById("no-thanks-btn");

    // --- NEW: Password Health Check References ---
    const passwordHealthBtn = document.getElementById("password-health-btn");
    const passwordHealthModal = document.getElementById("password-health-modal");
    const closeHealthModalBtn = document.getElementById("close-health-modal-btn");
    const pwnedCheckBtn = document.getElementById("pwned-check-btn");
    const pwnedPasswordInput = document.getElementById("pwned-password-input");
    const pwnedResultsDiv = document.getElementById("pwned-results");

        // Footprint Elements
        const footprintSvg = document.getElementById('footprint-svg');
        const footprintNode = document.getElementById('footprint-node');
        const clearFootprintBtn = document.getElementById('clear-footprint-btn');
        const footprintTooltip = document.getElementById('footprint-tooltip');

    const toolToggles = {
      utmStripping: document.getElementById("tool-utm-stripping"),
      fingerprintProtection: document.getElementById(
        "tool-fingerprint-protection"
      ),
      maliciousSiteProtection: document.getElementById(
        "tool-malicious-site-protection"
      ),
      darkMode: document.getElementById("tool-dark-mode"),
      elementHider: document.getElementById("tool-element-hider"),
      // notes: document.getElementById('tool-notes'),
      firewall: document.querySelector('[title="Firewall Settings"]'),
      // passwordManager: document.getElementById('password-manager'),
      // vpnToggle: document.getElementById('vpn-toggle')
    };

    // --- Mock Data & Helpers ---
    const BREACH_API = { 'facebook.com': { count: 1, last_breach: '2019-04-19' }, 'twitter.com': { count: 1, last_breach: '2018-05-03' }, 'linkedin.com': { count: 2, last_breach: '2021-06-22' }, 'yahoo.com': { count: 2, last_breach: '2013-08-01' }, 'adobe.com': { count: 1, last_breach: '2013-10-04' }, 'tumblr.com': { count: 1, last_breach: '2013-01-01' }, 'canva.com': { count: 1, last_breach: '2019-05-24' }, 'zynga.com': { count: 1, last_breach: '2019-09-12' }, 'dubsmash.com': { count: 1, last_breach: '2018-12-01' }, 'houzz.com': { count: 1, last_breach: '2018-12-01' }, 'verifications.io': { count: 1, last_breach: '2019-02-25' }, 'apollo.io': { count: 1, last_breach: '2018-07-23' }, '8tracks.com': { count: 1, last_breach: '2017-06-27' }, 'dailymotion.com': { count: 1, last_breach: '2016-10-20' }, 'edmodo.com': { count: 1, last_breach: '2017-04-22' }, 'last.fm': { count: 1, last_breach: '2012-03-01' }, 'myheritage.com': { count: 1, last_breach: '2017-10-26' }, 'ticketfly.com': { count: 1, last_breach: '2018-05-31' }, 'bitly.com': { count: 1, last_breach: '2014-05-08' }, 'dropbox.com': { count: 1, last_breach: '2012-07-01' }, 'mail.ru': { count: 1, last_breach: '2016-10-01' }, 'vk.com': { count: 1, last_breach: '2016-10-01' }, 'tumblr.com': { count: 1, last_breach: '2013-01-01' }, 'flickr.com': { count: 1, last_breach: '2014-05-25' }, 'ok.ru': { count: 1, last_breach: '2016-10-01' }, 'badoo.com': { count: 1, last_breach: '2016-10-01' }, 'vimeo.com': { count: 1, last_breach: '2014-05-25' }, 'soundcloud.com': { count: 1, last_breach: '2017-07-01' }, 'foursquare.com': { count: 1, last_breach: '2014-05-25' }, 'yandex.ru': { count: 1, last_breach: '2016-10-01' }, 'weibo.com': { count: 1, last_breach: '2016-10-01' }, 'twitch.tv': { count: 1, last_breach: '2020-10-06' }, 'reddit.com': { count: 1, last_breach: '2018-06-19' }, 'github.com': { count: 1, last_breach: '2012-04-01' }, 'bitbucket.org': { count: 1, last_breach: '2015-01-01' }, 'stackoverflow.com': { count: 1, last_breach: '2016-05-01' }, 'quora.com': { count: 1, last_breach: '2018-12-03' }, 'medium.com': { count: 1, last_breach: '2017-07-01' }, 'wordpress.com': { count: 1, last_breach: '2017-06-01' }, 'blogger.com': { count: 1, last_breach: '2014-05-01' }, 'tumblr.com': { count: 1, last_breach: '2013-01-01' }, 'livejournal.com': { count: 1, last_breach: '2016-10-01' }, 'typepad.com': { count: 1, last_breach: '2016-10-01' }, 'weebly.com': { count: 1, last_breach: '2016-10-01' }, 'wix.com': { count: 1, last_breach: '2016-10-01' }, 'yola.com': { count: 1, last_breach: '2016-10-01' }, 'webs.com': { count: 1, last_breach: '2016-10-01' }, 'jimdo.com': { count: 1, last_breach: '2016-10-01' }, 'squarespace.com': { count: 1, last_breach: '2016-10-01' }, 'weebly.com': { count: 1, last_breach: '2016-10-01' }, 'mareads.com': { count: 1, last_breach: '2016-10-01' }, 'webnode.com': { count: 1, last_breach: '2016-10-01' }, 'site123.com': { count: 1, last_breach: '2016-10-01' }, 'strikingly.com': { count: 1, last_breach: '2016-10-01' }, 'bravenet.com': { count: 1, last_breach: '2016-10-01' }, 'angelfire.com': { count: 1, last_breach: '2016-10-01' }, 'geocities.com': { count: 1, last_breach: '2016-10-01' }, 'robinsonsmalls.com': { count: 1, last_breach: '25-06-2025' }, 'tripod.com': { count: 1, last_breach: '2016-10-01' }, 'xanga.com': { count: 1, last_breach: '2016-10-01' }, 'live.com': { count: 1, last_breach: '2016-10-01' }, 'hotmail.com': { count: 1, last_breach: '2016-10-01' }, 'outlook.com': { count: 1, last_breach: '2016-10-01' } };
    let currentTabId = -1;
    let currentTabUrl = null;

    function checkAndShowReviewPrompt() {
      chrome.storage.sync.get(
        ["installDate", "reviewPromptDismissed"],
        (data) => {
          if (data.reviewPromptDismissed) {
            return; // User has permanently dismissed the prompt
          }

          const installDate = data.installDate;
          if (installDate) {
            //  const thirtyDaysInMillis = 5000;
            const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;
            if (Date.now() - installDate > thirtyDaysInMillis) {
              reviewModal.style.display = "flex";
            }
          }
        }
      );
    }

    // --- Core UI & Logic Functions ---
    function applySettings(callback) {
      chrome.storage.sync.get(
        ["theme", "dyslexiaFont", "isPremium"],
        (settings) => {
          document.documentElement.classList.toggle(
            "dark",
            settings.theme === "dark"
          );
          document.body.classList.toggle(
            "dyslexia-friendly",
            !!settings.dyslexiaFont
          );
          if (themeToggleBtn)
            themeToggleBtn.classList.toggle(
              "active",
              settings.theme === "dark"
            );
          if (fontToggleBtn)
            fontToggleBtn.classList.toggle("active", !!settings.dyslexiaFont);
          updatePremiumUI(!!settings.isPremium);
          if (callback) callback();
        }
      );
    }

    function saveAndApply(key, value) {
      chrome.storage.sync.set({ [key]: value }, () => {
        applySettings();
        chrome.runtime
          .sendMessage({ action: "settings_updated" })
          .catch((e) => {});
      });
    }

    function updatePremiumUI(isPremium) {
      if (proBadge)
        proBadge.style.display = isPremium ? "inline-block" : "none";
    }

    function checkBreachStatus(hostname) {
      const breachStatusEl = document.getElementById("breach-status");
      const breachInfo = document.getElementById("breach-info");
      const breachIconEl = document.getElementById("breach-icon");
      const siteRiskDisplay = document.getElementById("site-risk-display");
      const data = BREACH_API[hostname.replace("www.", "")];

      if (breachStatusEl && breachIconEl && siteRiskDisplay) {
        siteRiskDisplay.className = "site-risk-display"; // Reset classes
        if (data && data.count > 0) {
          breachStatusEl.textContent = `${data.count} Breaches`;
          breachInfo.textContent = `Last Breach: ${data.last_breach}`;
          breachInfo.style.fontWeight = "500";
          breachInfo.style.color = "var(--text-secondary-light)";
          breachInfo.style.textAlign = "center";
          siteRiskDisplay.classList.add(
            data.count > 1 ? "high-breaches" : "low-breaches"
          );
          breachInfo.style.display = "block";
        } else {
          breachStatusEl.textContent = "None Found";
          breachInfo.textContent = "No known breaches";
          siteRiskDisplay.classList.add("no-breaches");
          breachInfo.style.display = "none";
        }
      }
      return data ? data.count : 0;
    }

    function updatePrivacyScore(trackers = [], isSecure, breachCount) {
      let score = 100;
      score -= isSecure ? 0 : 40;
      score -= Math.min(breachCount * 10, 30);
      trackers.forEach((t) => {
        if (t.risk === "High") score -= 15;
        else if (t.risk === "Medium") score -= 7;
        else score -= 2;
      });

      if (trackers.length === 0 && isSecure && breachCount === 0) score = 100;
      score = Math.max(0, Math.round(score));

      let scoreLetter = "F",
        scoreBgColor = "var(--accent-red)";
      if (score >= 95) {
        scoreLetter = "A+";
        scoreBgColor = "var(--accent-green)";
      } else if (score >= 85) {
        scoreLetter = "A";
        scoreBgColor = "var(--accent-green)";
      } else if (score >= 70) {
        scoreLetter = "B";
        scoreBgColor = "#d97706";
      } else if (score >= 55) {
        scoreLetter = "C";
        scoreBgColor = "var(--accent-yellow)";
      } else if (score >= 40) {
        scoreLetter = "D";
        scoreBgColor = "#f97316";
      }

      const privacyScoreEl = document.getElementById("privacy-score");
      if (privacyScoreEl) {
        privacyScoreEl.textContent = scoreLetter;
        privacyScoreEl.style.backgroundColor = scoreBgColor;
        privacyScoreEl.setAttribute(
          "aria-label",
          `Privacy score: ${scoreLetter}`
        );
      }
    }

      // --- Footprint Visualization Logic ---
        function renderFootprint(data) {
            if (!footprintSvg || !data || !data.nodes || data.nodes.length === 0) {
                footprintSvg.innerHTML = `<text x="50%" y="50%" fill="var(--text-secondary-dark)" text-anchor="middle" font-size="12">No tracking activity on this tab yet.</text>`;
                return;
            }
            footprintSvg.innerHTML = '';

            const width = footprintSvg.clientWidth;
            const height = footprintSvg.clientHeight;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 30;

            const nodesById = {};
            data.nodes.forEach(node => {
                node.connections = new Set();
                nodesById[node.id] = node;
            });

            data.links.forEach(link => {
                if (nodesById[link.source] && nodesById[link.target]) {
                    nodesById[link.source].connections.add(link.target);
                    nodesById[link.target].connections.add(link.source);
                }
            });
            
            const centralNode = data.nodes.find(n => n.type === 'website');
            let otherNodes = data.nodes.filter(n => n.id !== (centralNode ? centralNode.id : ''));

            if (centralNode) {
                centralNode.x = centerX;
                centralNode.y = centerY;
            }

            const angleStep = (2 * Math.PI) / (otherNodes.length || 1);
            otherNodes.forEach((node, i) => {
                node.x = centerX + radius * Math.cos(i * angleStep);
                node.y = centerY + radius * Math.sin(i * angleStep);
            });

            const linkElements = data.links.map(link => {
                const sourceNode = nodesById[link.source];
                const targetNode = nodesById[link.target];
                if (!sourceNode || !targetNode) return null;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', sourceNode.x);
                line.setAttribute('y1', sourceNode.y);
                line.setAttribute('x2', targetNode.x);
                line.setAttribute('y2', targetNode.y);
                line.setAttribute('class', 'footprint-link');
                line.dataset.source = link.source;
                line.dataset.target = link.target;
                footprintSvg.appendChild(line);
                return line;
            }).filter(Boolean);

            const nodeElements = data.nodes.map(node => {
                const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                group.setAttribute('class', 'footprint-group');
                group.dataset.id = node.id;
                // Use transform for positioning the group
                group.setAttribute('transform', `translate(${node.x}, ${node.y})`);

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('r', node.type === 'website' ? 10 : 8);
                circle.setAttribute('class', `footprint-node ${node.type}`);
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('y', node.type === 'website' ? 24 : 20);
                text.textContent = node.label.replace(/^www\./, '');
                text.setAttribute('class', 'footprint-label');
                
                group.appendChild(circle);
                group.appendChild(text);
                footprintSvg.appendChild(group);

                // --- DRAGGING LOGIC (REWRITTEN & FIXED) ---
                let selectedElement = null;
                let offset;

                function getMousePosition(evt) {
                    const CTM = footprintSvg.getScreenCTM();
                    return {
                        x: (evt.clientX - CTM.e) / CTM.a,
                        y: (evt.clientY - CTM.f) / CTM.d
                    };
                }

                function startDrag(evt) {
                    selectedElement = group;
                    offset = getMousePosition(evt);
                    const transforms = selectedElement.transform.baseVal;
                    const translate = transforms.getItem(0);
                    offset.x -= translate.matrix.e;
                    offset.y -= translate.matrix.f;
                    
                    footprintSvg.addEventListener('mousemove', drag);
                    footprintSvg.addEventListener('mouseup', endDrag);
                    footprintSvg.addEventListener('mouseleave', endDrag);
                }

                function drag(evt) {
                    if (selectedElement) {
                        evt.preventDefault();
                        const mousePos = getMousePosition(evt);
                        const coordX = mousePos.x - offset.x;
                        const coordY = mousePos.y - offset.y;
                        
                        selectedElement.setAttributeNS(null, "transform", `translate(${coordX}, ${coordY})`);

                        linkElements.forEach(line => {
                            if (line.dataset.source === node.id) {
                                line.setAttributeNS(null, "x1", coordX);
                                line.setAttributeNS(null, "y1", coordY);
                            }
                            if (line.dataset.target === node.id) {
                                line.setAttributeNS(null, "x2", coordX);
                                line.setAttributeNS(null, "y2", coordY);
                            }
                        });
                    }
                }

                function endDrag() {
                    selectedElement = null;
                    footprintSvg.removeEventListener('mousemove', drag);
                    footprintSvg.removeEventListener('mouseup', endDrag);
                    footprintSvg.removeEventListener('mouseleave', endDrag);
                }
                
                group.addEventListener('mousedown', startDrag);

                // --- HOVER LOGIC ---
                group.addEventListener('mouseover', () => {
                    if(selectedElement) return;
                    footprintTooltip.textContent = node.label;
                    footprintTooltip.style.opacity = '1';
                    nodeElements.forEach(el => el.classList.add('dimmed'));
                    linkElements.forEach(el => el.classList.add('dimmed'));
                    group.classList.remove('dimmed');
                    group.querySelector('.footprint-node').classList.add('hovered');
                    group.querySelector('.footprint-label').classList.add('highlighted');
                    node.connections.forEach(connId => {
                        const connectedNode = footprintSvg.querySelector(`[data-id="${connId}"]`);
                        if(connectedNode) connectedNode.classList.remove('dimmed');
                    });
                    linkElements.forEach(link => {
                        if (link.dataset.source === node.id || link.dataset.target === node.id) {
                            link.classList.remove('dimmed');
                            link.classList.add('highlighted');
                        }
                    });
                });

                group.addEventListener('mousemove', (e) => {
                    if(selectedElement) return;
                    const rect = footprintSvg.getBoundingClientRect();
                    footprintTooltip.style.left = `${e.clientX - rect.left}px`;
                    footprintTooltip.style.top = `${e.clientY - rect.top - 10}px`;
                });

                group.addEventListener('mouseout', () => {
                    if(selectedElement) return;
                    footprintTooltip.style.opacity = '0';
                    nodeElements.forEach(el => el.classList.remove('dimmed'));
                    linkElements.forEach(el => el.classList.remove('dimmed'));
                    group.querySelector('.footprint-node').classList.remove('hovered');
                    group.querySelector('.footprint-label').classList.remove('highlighted');
                    linkElements.forEach(link => link.classList.remove('highlighted'));
                });

                return group;
            });
        }
    function loadAndRenderFootprint() {
      if (currentTabId !== -1) {
        chrome.runtime.sendMessage(
          { action: "get_footprint_data", tabId: currentTabId },
          (response) => {
            renderFootprint(response);
            const domain = new URL(currentTabUrl).hostname;
            footprintHeader.innerHTML = 'Footprint for <b>' + domain + '</b>';
          }
        );
      }
    }

    function createTrackerElement(tracker) {
      const riskColors = { Low: "#dcfce7", Medium: "#fef9c3", High: "#fee2e2" };
      const riskTextColors = {
        Low: "#166534",
        Medium: "#92400e",
        High: "#991b1b",
      };
      const riskBg = riskColors[tracker.risk] || "#f3f4f6";
      const riskText = riskTextColors[tracker.risk] || "#374151";
      const div = document.createElement("div");
      div.className = "tracker-item";
      div.style.cssText = `display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; padding: 0.375rem 0;`;
      div.innerHTML = `<p style="font-weight: 500;">${
        tracker.name || "Unknown"
      }</p><span style="font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 9999px; background-color:${riskBg}; color:${riskText};">${
        tracker.risk
      } Risk</span>`;
      return div;
    }

    function renderInitialTrackers(trackers = []) {
      if (!trackerListEl) return;
      trackerListEl.innerHTML = "";
      if (trackers.length === 0) {
        trackerListEl.innerHTML = `<p style="font-size: 0.875rem; text-align: center; color: var(--text-secondary-light); padding: 1rem;">No trackers detected yet.</p>`;
      } else {
        trackers.forEach((tracker) =>
          trackerListEl.appendChild(createTrackerElement(tracker))
        );
      }
      if (trackersCountEl)
        trackersCountEl.textContent = `${trackers.length} Trackers Detected`;
    }

    function renderNewsTicker(headlines = []) {
      if (!newsContent || !newsTickerContainer || headlines.length === 0) {
        if (newsTickerContainer) newsTickerContainer.style.display = "none";
        return;
      }
      if (dateBadge)
        dateBadge.textContent = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      if (newsContent) {
        newsContent.innerHTML = headlines
          .map((headline) => `<span class="news-item">${headline}</span>`)
          .join("");
        newsContent.innerHTML += newsContent.innerHTML; // Duplicate for seamless scroll
      }
      if (newsTickerContainer) newsTickerContainer.style.display = "flex";
    }

    function showModal(modalElement, duration = 2000) {
      if (!modalElement) return;
      modalElement.classList.add("show");
      setTimeout(() => modalElement.classList.remove("show"), duration);
    }

    // --- Event Listener Setup ---
    function setupEventListeners() {
      const createPopup = (url, width, height) =>
        chrome.windows.create({
          url: chrome.runtime.getURL(url),
          type: "popup",
          width,
          height,
        });
      // --- Secure Feature Handling ---
      const handleSecureFeatureClick = (targetPage) => {
        chrome.storage.sync.get("securityPin", (data) => {
          if (data.securityPin) {
            // If PIN is set, prompt for it.
            createPopup(`pin_prompt.html?target=${targetPage}`, 350, 400);
          } else {
            // If no PIN, go to setup.
            createPopup(`security_setup.html?target=${targetPage}`, 450, 550);
          }
        });
      };

      if (notesBtn) {
        notesBtn.addEventListener("click", () =>
          handleSecureFeatureClick("notes.html")
        );
      }
      if (passwordManagerBtn) {
        passwordManagerBtn.addEventListener("click", () =>
          handleSecureFeatureClick("passwords.html")
        );
      }
      // FIXED: This function now intelligently ignores the common "port closed" error.
      const sendMessageToContent = (message) => {
        if (currentTabId !== -1) {
          chrome.tabs.sendMessage(currentTabId, message, () => {
            if (
              chrome.runtime.lastError &&
              chrome.runtime.lastError.message !==
                "The message port closed before a response was received."
            ) {
              console.error(
                `Error sending message: ${chrome.runtime.lastError.message}`
              );
            }
          });
        }
      };

      if (settingsLink)
        settingsLink.addEventListener("click", () =>
          createPopup("settings.html", 550, 700)
        );
      if (dashboardLink)
        dashboardLink.addEventListener("click", () =>
          createPopup("dashboard.html", 1100, 720)
        );
      if (privacyArcadeBtn)
        privacyArcadeBtn.addEventListener("click", () =>
          createPopup("games_menu.html", 820, 480)
        );

      if (summarizeBtn)
        summarizeBtn.addEventListener("click", () =>
          sendMessageToContent({ action: "summarize_policy" })
        );
      if (requestBtn)
        requestBtn.addEventListener("click", () => {
          if (currentTabUrl) {
            const domain = new URL(currentTabUrl).hostname;
            createPopup(`request.html?domain=${domain}`, 600, 700);
          }
        });

      // Review Prompt Button Listeners
      if (rateNowBtn) {
        rateNowBtn.addEventListener("click", () => {
          // Replace with your actual extension store URL
          chrome.tabs.create({
            url: "https://chrome.google.com/webstore/detail/pkonihncnkmbejhhjadaognganhinnhc",
          });
          chrome.storage.sync.set({ reviewPromptDismissed: true });
          reviewModal.style.display = "none";
        });
      }
      if (remindLaterBtn) {
        remindLaterBtn.addEventListener("click", () => {
          reviewModal.style.display = "none";
        });
      }
      if (noThanksBtn) {
        noThanksBtn.addEventListener("click", () => {
          chrome.storage.sync.set({ reviewPromptDismissed: true });
          reviewModal.style.display = "none";
        });
      }

      // --- Tab Lock Feature ---
      if (tabLockBtn) {
        tabLockBtn.addEventListener("click", () => {
          chrome.storage.sync.get("securityPin", (data) => {
            if (data.securityPin) {
              // If PIN exists, send message to background to lock the tab
              chrome.runtime.sendMessage(
                { action: "lock_tab", tabId: currentTabId },
                (response) => {
                  if (response && response.success) {
                    showModal(tabLockedModal);
                    setTimeout(() => window.close(), 1000);
                  }
                }
              );
            } else {
              // If no PIN, redirect to setup, indicating tab lock is the goal
              createPopup("security_setup.html?target=tablock", 450, 550);
            }
          });
        });
      }
 // New Event Listener for DNS Info
            if (dnsInfoBtn) {
                dnsInfoBtn.addEventListener('click', () => {
                    if (currentTabUrl) {
                        try {
                            const domain = new URL(currentTabUrl).hostname;
                            createPopup((`dns_info.html?domain=${domain}`), 450, 550);
                        } catch (e) {
                            // Handle invalid URLs like about:blank
                            console.log("Cannot get DNS info for this page.");
                        }
                    }
                });
            }

             // --- NEW: Password Health Check Listeners ---
      if (passwordHealthBtn) {
        passwordHealthBtn.addEventListener("click", () => {
            passwordHealthModal.style.display = 'flex';
        });
      }
      if (closeHealthModalBtn) {
        closeHealthModalBtn.addEventListener("click", () => {
            passwordHealthModal.style.display = 'none';
        });
      }
      if (pwnedCheckBtn) {
        pwnedCheckBtn.addEventListener("click", handlePwnedPasswordCheck);
      }
      // MODIFIED: Clear footprint data for the current tab
      if (clearFootprintBtn) {
        clearFootprintBtn.addEventListener("click", () => {
          if (currentTabId !== -1) {
            chrome.runtime.sendMessage(
              { action: "clear_footprint_data", tabId: currentTabId },
              () => {
                loadAndRenderFootprint();
              }
            );
          }
        });
      }

      if (destroyCookiesBtn)
        destroyCookiesBtn.addEventListener("click", () => {
          if (!currentTabUrl) return;
          const url = new URL(currentTabUrl);
          chrome.cookies.getAll({ url: currentTabUrl }, (cookies) => {
            const cookieCount = cookies.length;
            cookies.forEach((cookie) =>
              chrome.cookies.remove({
                url: `${url.protocol}//${cookie.domain}${cookie.path}`,
                name: cookie.name,
              })
            );

            if (cookiesDestroyedMessageEl)
              cookiesDestroyedMessageEl.textContent = `${cookieCount} Cookie(s) Destroyed!`;
            if (cookiesDestroyedTimestampEl)
              cookiesDestroyedTimestampEl.textContent = `for ${
                url.hostname
              } at ${new Date().toLocaleTimeString()}`;
            showModal(cookiesDestroyedModal);
          });
        });

      if (clearCacheBtn)
        clearCacheBtn.addEventListener("click", () => {
          chrome.browsingData.removeCache({}, () => {
            if (cacheTimestampEl)
              cacheTimestampEl.textContent = `at ${new Date().toLocaleTimeString()}`;
            showModal(cacheClearedModal);
          });
        });

      if (privacyCoachBtn)
        privacyCoachBtn.addEventListener("click", () => {
          const tips = {
            default:
              "Regularly clear your cookies and cache to remove leftover trackers.",
            social:
              "Review your social media privacy settings. Who can see your posts?",
            shopping:
              "Beware of dynamic pricing. Prices can change based on your browsing history.",
            news: "Use a 'burner' email for newsletters to avoid spam in your primary inbox.",
            finance:
              "Always use two-factor authentication (2FA) on financial websites.",
          };
          let tip = tips.default;
          if (currentTabUrl) {
            const domain = new URL(currentTabUrl).hostname;
            if (
              domain.includes("facebook") ||
              domain.includes("twitter") ||
              domain.includes("linkedin")
            )
              tip = tips.social;
            else if (
              domain.includes("amazon") ||
              domain.includes("ebay") ||
              domain.includes("walmart")
            )
              tip = tips.shopping;
            else if (domain.includes("bank") || domain.includes("paypal"))
              tip = tips.finance;
            else if (document.querySelector("article")) tip = tips.news;
          }

          if (privacyTipContent) privacyTipContent.textContent = tip;
          showModal(privacyCoachModal, 4000);
        });

      if (cleanShareBtn)
        cleanShareBtn.addEventListener("click", () => {
          if (!currentTabUrl) return;
          let url = new URL(currentTabUrl);
          const paramsToRemove = [
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_term",
            "utm_content",
            "fbclid",
            "gclid",
            "msclkid",
            "mc_cid",
            "mc_eid",
          ];
          paramsToRemove.forEach((param) => {
            if (url.searchParams.has(param)) {
              url.searchParams.delete(param);
            }
          });
          const cleanUrl = url.toString();
          navigator.clipboard
            .writeText(cleanUrl)
            .then(() => {
              showModal(cleanShareModal);
            })
            .catch((err) => console.error("Failed to copy clean URL: ", err));
        });

      if (readingViewBtn) {
        readingViewBtn.addEventListener("click", () => {
          if (
            chrome.scripting &&
            typeof chrome.scripting.executeScript === "function"
          ) {
            chrome.scripting.executeScript(
              {
                target: { tabId: currentTabId },
                files: ["reading_view.js"],
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error(
                    `Error injecting script: ${chrome.runtime.lastError.message}. This can happen on special pages like chrome:// or the web store.`
                  );
                  return;
                }
                sendMessageToContent({ action: "toggle_reading_view" });
              }
            );
          } else {
            console.error(
              "Reading View feature failed: `chrome.scripting` API not found. Please ensure the 'scripting' permission is in your manifest.json file."
            );
            readingViewBtn.disabled = true;
            readingViewBtn.title =
              "Reading View feature is unavailable. See console for details.";
          }
        });
      }

      if (themeToggleBtn)
        themeToggleBtn.addEventListener("click", () =>
          saveAndApply(
            "theme",
            document.documentElement.classList.contains("dark")
              ? "light"
              : "dark"
          )
        );
      if (fontToggleBtn)
        fontToggleBtn.addEventListener("click", () =>
          saveAndApply(
            "dyslexiaFont",
            !document.body.classList.contains("dyslexia-friendly")
          )
        );

      for (const [key, element] of Object.entries(toolToggles)) {
        if (element) {
          element.addEventListener("click", () => {
            if (key === "notes" || key === "passwordManager") {
              const targetPage =
                key === "notes" ? "notes.html" : "passwords.html";
              chrome.storage.sync.get("securityPin", (data) => {
                if (data.securityPin) {
                  createPopup(`pin_prompt.html?target=${targetPage}`, 350, 400);
                } else {
                  createPopup(
                    `security_setup.html?target=${targetPage}`,
                    450,
                    550
                  );
                }
              });
              return;
            }

            if (key === "firewall")
              return createPopup("firewall.html", 550, 650);

            const isEnabled = !element.classList.contains("enabled");
            element.classList.toggle("enabled", isEnabled);
            chrome.storage.sync.set({ [key]: isEnabled });
            chrome.runtime.sendMessage({
              action: "toggle_feature",
              feature: key,
              enabled: isEnabled,
            });

            if (key === "elementHider" && isEnabled) {
              sendMessageToContent({ action: "activate_element_hider" });
            }
          });
        }
      }
    }

    function loadToolSettings() {
      const featureKeys = Object.keys(toolToggles).filter(
        (k) => !["notes", "firewall", "passwordManager"].includes(k)
      );
      chrome.storage.sync.get(featureKeys, (settings) => {
        for (const feature of featureKeys) {
          if (toolToggles[feature]) {
            toolToggles[feature].classList.toggle(
              "enabled",
              !!settings[feature]
            );
          }
        }
      });
    }

    // --- NEW: Password Health Check Logic ---
    function handlePwnedPasswordCheck() {
      const password = pwnedPasswordInput.value;

      if (!password) {
        pwnedResultsDiv.innerHTML = `<div class="pwned-result error"><div class="pwned-result-content"><p>Please enter a password to check.</p></div></div>`;
        return;
      }

      pwnedResultsDiv.innerHTML = `<p style="text-align: center; padding: 1rem 0;">Checking...</p>`;

      const safeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
      const pwnedIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`;
      const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`;

      chrome.runtime.sendMessage(
        { action: "check_pwned_password", password: password },
        (response) => {
          if (!response || !response.success) {
            pwnedResultsDiv.innerHTML = `
                <div class="pwned-result error">
                    <div class="pwned-icon">${errorIcon}</div>
                    <div class="pwned-result-content">
                        <h3>Request Failed</h3>
                        <p>${response ? response.error : "An unknown error occurred."}</p>
                    </div>
                </div>`;
          } else if (response.isPwned) {
            pwnedResultsDiv.innerHTML = `
                <div class="pwned-result pwned">
                    <div class="pwned-icon">${pwnedIcon}</div>
                    <div class="pwned-result-content">
                        <h3>Warning! Password Pwned!</h3>
                        <p>This password has appeared in breaches at least <strong>${response.count.toLocaleString()}</strong> times. You should not use it.</p>
                    </div>
                </div>`;
          } else {
            pwnedResultsDiv.innerHTML = `
                <div class="pwned-result safe">
                    <div class="pwned-icon">${safeIcon}</div>
                    <div class="pwned-result-content">
                        <h3>Secure! Password Not Found.</h3>
                        <p>This password was not found in any known data breaches. Good job!</p>
                    </div>
                </div>`;
          }

          // **NEW: Clear the input field after 5 seconds for privacy**
          setTimeout(() => {
            pwnedPasswordInput.value = "";
            pwnedResultsDiv.innerHTML = "";
          }, 5000);
        }
      );
    }

    function updateDynamicContent(tab) {
      if (!tab || !tab.id || !tab.url || !tab.url.startsWith("http")) {
        document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary-light);">Digital Shield is active on web pages.</div>`;
        document.body.style.visibility = "visible";
        document.body.style.opacity = "1";
        return;
      }

      currentTabId = tab.id;
      currentTabUrl = tab.url;

      const url = new URL(tab.url);
      const domain = url.hostname;
      document.getElementById("current-site").textContent = domain;
      const isSecure = url.protocol === "https:";
      const breachCount = checkBreachStatus(domain);

      chrome.storage.local.get(tab.id.toString(), (result) => {
        const tabData = result[tab.id.toString()] || {};
        const trackers = tabData.trackers || [];

        updatePrivacyScore(trackers, isSecure, breachCount);
        renderInitialTrackers(trackers);
        document.body.style.visibility = "visible";
        document.body.style.opacity = "1";
      });
    }

    function initialize() {
      applySettings();
      setupEventListeners();
      loadToolSettings();

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          // currentTabId = tabs[0].id;
          // currentTabUrl = tabs[0].url;
          updateDynamicContent(tabs[0]);
        } else {
          document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary-light);">Could not find an active tab.</div>`;
          document.body.style.visibility = "visible";
          document.body.style.opacity = "1";
        }
        checkAndShowReviewPrompt();
        loadAndRenderFootprint();
      });

      chrome.storage.local.get("privacyNews", (data) => {
        const mockNews = [
          "Major tech firm announces new privacy-focused features.",
          "Data breach at popular social media site affects millions.",
          "New regulations aim to give users more control over their data.",
        ];
        renderNewsTicker(
          data.privacyNews && data.privacyNews.length > 0
            ? data.privacyNews
            : mockNews
        );
      });
    }

    initialize();
  } catch (error) {
    console.error("Popup script error:", error);
    document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary-light);">Error: Popup initialization failed. Please try again.</div>`;
    document.body.style.visibility = "visible";
    document.body.style.opacity = "1";
  }
});
