document.addEventListener("DOMContentLoaded", () => {
  try {
    const personasContainer = document.getElementById("personas-container");
    const advancedContainer = document.getElementById(
      "advanced-protection-container"
    );
    const mainContent = document.querySelector("main");
    let isPremium = false;

    // Using the modern icons from the previous update
    const personaIcons = {
      balanced: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9.09 9.09 5.83 5.83M14.92 9.09l-5.83 5.83"/></svg>`,
      "max-security": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      "work-mode": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    };
    const proToggleIcons = {
      sandboxMode: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    };

    const personas = [
      {
        id: "balanced",
        name: "Balanced",
        description: "Blocks trackers, keeps sites functional.",
        pro: false,
      },
      {
        id: "max-security",
        name: "High-Risk Blocking",
        description: "Aggressively blocks all trackers.",
        pro: true,
      },
      {
        id: "work-mode",
        name: "Work Mode",
        description: "Allows common analytics tools.",
        pro: true,
      },
    ];

    const proToggles = [
      {
        id: "sandboxMode",
        name: "Privacy Sandbox",
        description:
          "Neutralize trackers and feed them fake data to protect your real identity — smarter than just blocking.",
      },
    ];

    function renderAllSettings() {
      renderPersonaSettings();
      renderProSettings();
      addEventListeners();
      loadAndApplySavedSettings();
    }

    function renderPersonaSettings() {
      personasContainer.innerHTML = personas
        .map(
          (p) => `
                <label class="persona-card ${
                  p.pro && !isPremium ? "locked" : ""
                }" data-persona-id="${p.id}">
                    <input type="radio" name="blocking-persona" value="${
                      p.id
                    }" ${p.pro && !isPremium ? "disabled" : ""}>
                    <div class="persona-content-wrapper" style="display: flex; align-items: center;">
                        <div class="persona-icon">${personaIcons[p.id]}</div>
                        <div>
                            <span class="setting-label">${p.name} ${
            p.pro ? '<span class="pro-tag">PRO</span>' : ""
          }</span>
                            <p class="setting-desc">${p.description}</p>
                        </div>
                    </div>
                </label>
            `
        )
        .join("");
    }

    function renderProSettings() {
      advancedContainer.innerHTML = proToggles
        .map(
          (t) => `
                <div class="setting-item ${
                  !isPremium ? "locked" : ""
                }" data-feature-id="${t.id}">
                    <div class="setting-item-content">
                        <div class="setting-item-icon">${
                          proToggleIcons[t.id]
                        }</div>
                        <div>
                            <p class="setting-label">${
                              t.name
                            } <span class="pro-tag">PRO</span></p>
                            <p class="setting-desc">${t.description}</p>
                        </div>
                    </div>
                    <label class="toggle-label">
                        <input type="checkbox" id="${
                          t.id
                        }-toggle" class="toggle-checkbox" ${
            !isPremium ? "disabled" : ""
          }>
                        <div class="toggle-switch"></div>
                    </label>
                </div>
            `
        )
        .join("");
    }

    function addEventListeners() {
      document.querySelectorAll(".persona-card").forEach((card) => {
        card.addEventListener("click", () => {
          if (card.classList.contains("locked")) {
            initiatePurchase();
            return;
          }
          const radio = card.querySelector('input[type="radio"]');
          if (radio && !radio.checked) {
            radio.checked = true;
            updatePersonaSelection();
            const browserAPI =
              typeof browser !== "undefined" ? browser : chrome;
            browserAPI.runtime.sendMessage({
              action: "update_blocking_persona",
              persona: radio.value,
            });
            browserAPI.storage.sync.set({ blockingPersona: radio.value });
          }
        });
      });

      document.querySelectorAll(".setting-item.locked").forEach((item) => {
        item.addEventListener("click", initiatePurchase);
      });

      const sandboxToggle = document.getElementById("sandboxMode-toggle");
      if (sandboxToggle && !sandboxToggle.disabled) {
        sandboxToggle.addEventListener("change", () => {
          const enabled = sandboxToggle.checked;
          const browserAPI = typeof browser !== "undefined" ? browser : chrome;
          browserAPI.runtime.sendMessage({
            action: "toggle_sandbox",
            enabled: enabled,
          });
          browserAPI.storage.sync.set({ sandboxMode: enabled });
        });
      }
      // const pwnedCheckBtn = document.getElementById("pwned-check-btn");
      // if (pwnedCheckBtn) {
      //   pwnedCheckBtn.addEventListener("click", handlePwnedPasswordCheck);
      // }
    }

    // function handlePwnedPasswordCheck() {
    //   const passwordInput = document.getElementById("pwned-password-input");
    //   const resultsDiv = document.getElementById("pwned-results");
    //   const password = passwordInput.value;

    //   if (!password) {
    //     resultsDiv.innerHTML = `<p style="color: var(--accent-red);">Please enter a password to check.</p>`;

    //     // --- ADDED: Set timeout for the initial error message ---
    //     setTimeout(() => {
    //       resultsDiv.innerHTML = "";
    //     }, 5000);
    //     return;
    //   }

    //   resultsDiv.innerHTML = `<p>Checking...</p>`;

    //   const safeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
    //   const pwnedIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`;
    //   const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`;

    //   chrome.runtime.sendMessage(
    //     { action: "check_pwned_password", password: password },
    //     (response) => {
    //       if (!response.success) {
    //         resultsDiv.innerHTML = `
    //             <div class="pwned-result error">
    //                 <div class="pwned-icon">${errorIcon}</div>
    //                 <div class="pwned-result-content">
    //                     <h3>Request Failed</h3>
    //                     <p>${response.error}</p>
    //                 </div>
    //             </div>`;
    //       } else if (response.isPwned) {
    //         resultsDiv.innerHTML = `
    //             <div class="pwned-result pwned">
    //                 <div class="pwned-icon">${pwnedIcon}</div>
    //                 <div class="pwned-result-content">
    //                     <h3>Warning! Password Pwned!</h3>
    //                     <p>This password has appeared in breaches at least <strong>${response.count.toLocaleString()}</strong> times. You should not use it.</p>
    //                 </div>
    //             </div>`;
    //       } else {
    //         resultsDiv.innerHTML = `
    //             <div class="pwned-result safe">
    //                 <div class="pwned-icon">${safeIcon}</div>
    //                 <div class="pwned-result-content">
    //                     <h3>Secure! Password Not Found.</h3>
    //                     <p>This password was not found in any known data breaches. Good job!</p>
    //                 </div>
    //             </div>`;
    //       }

    //       // --- ADDED: This block will clear the results after 5 seconds ---
    //       // It's placed here so it runs after any of the above results are displayed.
    //       setTimeout(() => {
    //         // To make the disappearance smooth, you can add a fade-out effect
    //         const resultElement = resultsDiv.querySelector(".pwned-result");
    //         if (resultElement) {
    //           resultElement.style.transition = "opacity 0.5s ease-out";
    //           resultElement.style.opacity = "0";

    //           // Remove the element from the DOM after the transition completes
    //           setTimeout(() => {
    //             resultsDiv.innerHTML = "";
    //           }, 500); // Corresponds to the transition duration
    //         } else {
    //           resultsDiv.innerHTML = ""; // Fallback for messages without the .pwned-result wrapper
    //         }
    //       }, 5000); // 5000 milliseconds = 5 seconds
    //     }
    //   );
    // }

    function updatePersonaSelection() {
      document.querySelectorAll(".persona-card").forEach((card) => {
        const radio = card.querySelector('input[type="radio"]');
        if (radio.checked) {
          card.style.borderColor = "var(--primary-blue)";
          card.style.boxShadow = "0 0 10px rgba(0, 95, 204, 0.2)";
        } else {
          card.style.borderColor = "var(--border-color)";
          card.style.boxShadow = "none";
        }
      });
    }

    function loadAndApplySavedSettings() {
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      browserAPI.storage.sync.get(
        ["blockingPersona", "sandboxMode"],
        (settings) => {
          const currentPersona = settings.blockingPersona || "balanced";
          const radio = document.querySelector(
            `input[name="blocking-persona"][value="${currentPersona}"]`
          );
          if (radio) radio.checked = true;
          updatePersonaSelection();

          const sandboxToggle = document.getElementById("sandboxMode-toggle");
          if (sandboxToggle) sandboxToggle.checked = !!settings.sandboxMode;
        }
      );
    }

    function renderLicenseActivation() {
      let container = document.getElementById("license-activation-container");
      if (isPremium) {
        if (container) container.remove();
        return;
      }
      if (!container) {
        container = document.createElement("div");
        container.id = "license-activation-container";
        mainContent.prepend(container);
      }
      container.className = "card";
      container.innerHTML = `
                <h2 class="card-title">Activate Digital Shield PRO</h2>
                 <p class="setting-desc" style="margin-top: 0.5rem; margin-bottom: 1rem;">Paste the license key from your Gumroad receipt email to unlock all premium features.</p>
                <form id="license-activation-form">
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="license-key-input" placeholder="Enter your license key" required>
                        <button type="submit" class="btn-activate">Activate</button>
                    </div>
                </form>
            `;
      document
        .getElementById("license-activation-form")
        .addEventListener("submit", handleLicenseActivation);
    }

    async function handleLicenseActivation(e) {
      e.preventDefault();
      const keyInput = document.getElementById("license-key-input");
      const activateButton = e.submitter;
      const licenseKey = keyInput.value.trim();
      if (!licenseKey) return;

      // Provide immediate feedback to the user
      keyInput.disabled = true;
      activateButton.textContent = "Verifying...";
      activateButton.disabled = true;

      try {
        const browserAPI = typeof browser !== "undefined" ? browser : chrome;
        // The background script will handle the verification and storage update.
        // The storage listener below will then handle the UI update.
        await browserAPI.runtime.sendMessage({
          action: "verifyGumroadLicense",
          licenseKey: licenseKey,
        });
      } catch (error) {
        console.error("License activation failed:", error);
        alert("An error occurred during activation.");
        // Re-enable the form if there was an error sending the message
        keyInput.disabled = false;
        activateButton.textContent = "Activate";
        activateButton.disabled = false;
      }
    }

    function initiatePurchase() {
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;
      browserAPI.windows.create({
        url: "upgrade.html",
        type: "popup",
        width: 500,
        height: 650,
      });
    }

    // --- Initialization and Storage Listener ---
    const browserAPI = typeof browser !== "undefined" ? browser : chrome;

    // This function loads the initial state AND re-renders the entire UI
    function initializeAndRender() {
      browserAPI.storage.sync.get("isPremium", (data) => {
        isPremium = !!data.isPremium;
        renderLicenseActivation(); // This will show/hide the activation form
        renderAllSettings(); // This re-renders all settings to lock/unlock them
      });
    }

    // This listener is now the key to updating the UI after a successful purchase
    browserAPI.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes.isPremium) {
        console.log("Pro status changed, re-rendering UI.");
        initializeAndRender(); // Re-run the entire setup and render process
      }
    });

    // Initial load of the page
    initializeAndRender();
  } catch (error) {
    console.error("Settings script error:", error);
  } finally {
    document.body.style.visibility = "visible";
    document.body.style.opacity = "1";
  }
});
