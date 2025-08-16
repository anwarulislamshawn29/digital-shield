// file: element_hider.js

(() => {
    let isActive = false;
    let highlightOverlay = null;
    let currentTarget = null;

    function createOverlay() {
        if (highlightOverlay) return;
        highlightOverlay = document.createElement('div');
        highlightOverlay.style.position = 'fixed';
        highlightOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
        highlightOverlay.style.border = '2px dashed red';
        highlightOverlay.style.borderRadius = '3px';
        highlightOverlay.style.zIndex = '2147483647';
        highlightOverlay.style.pointerEvents = 'none';
        document.body.appendChild(highlightOverlay);
    }

    function removeOverlay() {
        if (highlightOverlay) {
            highlightOverlay.remove();
            highlightOverlay = null;
        }
    }

    function updateOverlay(target) {
        if (!highlightOverlay || !target) return;
        const rect = target.getBoundingClientRect();
        highlightOverlay.style.top = `${rect.top}px`;
        highlightOverlay.style.left = `${rect.left}px`;
        highlightOverlay.style.width = `${rect.width}px`;
        highlightOverlay.style.height = `${rect.height}px`;
    }

    function handleMouseMove(event) {
        if (!isActive) return;
        const target = document.elementFromPoint(event.clientX, event.clientY);
        if (target && target !== highlightOverlay && target !== document.body && target !== document.documentElement) {
            currentTarget = target;
            updateOverlay(currentTarget);
        }
    }

    function handleClick(event) {
        if (!isActive || !currentTarget) return;
        event.preventDefault();
        event.stopPropagation();
        
        currentTarget.style.display = 'none';
        deactivate();
    }

    function handleKeyDown(event) {
        if (isActive && event.key === "Escape") {
            deactivate();
        }
    }

    function activate() {
        if (isActive) return;
        isActive = true;
        createOverlay();
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyDown, true);
        document.body.style.cursor = 'crosshair';
    }

    function deactivate() {
        if (!isActive) return;
        isActive = false;
        removeOverlay();
        document.removeEventListener('mousemove', handleMouseMove, true);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('keydown', handleKeyDown, true);
        document.body.style.cursor = 'default';
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'activate_element_hider') {
            activate();
        }
    });
})();