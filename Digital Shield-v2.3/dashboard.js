// Function to apply theme and font settings
function applySettings() {
    chrome.storage.sync.get(['theme', 'dyslexiaFont'], (settings) => {
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
        document.body.style.fontFamily = settings.dyslexiaFont ? 'Verdana, Arial, sans-serif' : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    });
}

// Listen for live updates from the settings page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "settings_updated") {
        applySettings();
    }
});


document.addEventListener('DOMContentLoaded', () => {
    applySettings(); // Apply settings on initial load

    // Load and display all data from storage
    chrome.storage.local.get(null, (data) => {
        const allTrackers = [];
        const trackerCounts = {};
        const categoryCounts = {};
        const dailyActivity = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (const key in data) {
            if (data[key] && Array.isArray(data[key].trackers)) {
                data[key].trackers.forEach(tracker => {
                    allTrackers.push(tracker);
                    trackerCounts[tracker.name] = (trackerCounts[tracker.name] || 0) + 1;
                    categoryCounts[tracker.category] = (categoryCounts[tracker.category] || 0) + 1;
                });
            }
            if (data[key] && data[key].timestamp) {
                const day = new Date(data[key].timestamp).getDay();
                dailyActivity[days[day]] += data[key].trackers.length;
            }
        }

        document.getElementById('total-trackers').textContent = allTrackers.length;
        const mostCommon = Object.keys(trackerCounts).reduce((a, b) => trackerCounts[a] > trackerCounts[b] ? a : b, '-');
        document.getElementById('common-tracker').textContent = mostCommon;
        const reduction = Math.min(99, Math.floor(allTrackers.length / 10)); 
        document.getElementById('footprint-reduction').textContent = `${reduction}%`;

        renderCategoryChart(categoryCounts);
        renderActivityChart(dailyActivity);
        renderTopTrackers(trackerCounts); // New function call
    });

    function renderTopTrackers(trackerData) {
        const listEl = document.getElementById('top-trackers-list');
        if (!listEl) return;

        // Convert to array, sort by count descending, and take top 10
        const sortedTrackers = Object.entries(trackerData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        if (sortedTrackers.length === 0) {
            listEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 text-center">No trackers have been blocked yet.</p>`;
            return;
        }

        listEl.innerHTML = sortedTrackers.map(([name, count]) => {
            return `
                <div class="flex items-center justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="font-medium text-gray-800 dark:text-gray-200 truncate pr-4">${name}</span>
                    <span class="font-bold text-indigo-500 dark:text-indigo-400">${count}</span>
                </div>
            `;
        }).join('');
    }

    function renderCategoryChart(categoryData) {
        const ctx = document.getElementById('category-chart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    label: 'Trackers by Category',
                    data: Object.values(categoryData),
                    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                    hoverOffset: 4
                }]
            },
             options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
        });
    }

    function renderActivityChart(activityData) {
        const ctx = document.getElementById('activity-chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(activityData),
                datasets: [{
                    label: 'Trackers Blocked Per Day',
                    data: Object.values(activityData),
                    fill: false,
                    borderColor: '#6366F1',
                    tension: 0.1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }
      // --- NEW FEATURE: Auto-close window when it loses focus ---
        window.addEventListener('blur', () => {
            window.close();
        });

});
