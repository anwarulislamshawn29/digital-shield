// file: dns_info.js

document.addEventListener('DOMContentLoaded', () => {
    const domainNameEl = document.getElementById('domain-name');
    const resultsContainer = document.getElementById('dns-results');
    const loader = document.getElementById('loader');

    const urlParams = new URLSearchParams(window.location.search);
    const domain = urlParams.get('domain');

    if (domain) {
        domainNameEl.textContent = domain;
        fetchDnsInfo(domain);
    } else {
        resultsContainer.innerHTML = '<p>No domain specified.</p>';
    }

    async function fetchDnsRecords(domain, type) {
        try {
            const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.Answer ? data.Answer.map(ans => ans.data) : [];
        } catch (error) {
            console.error(`Error fetching ${type} records:`, error);
            return [];
        }
    }

    async function fetchDnsInfo(domain) {
        const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT'];
        const allRecords = {};

        for (const type of recordTypes) {
            allRecords[type] = await fetchDnsRecords(domain, type);
        }

        loader.style.display = 'none';
        renderDnsInfo(allRecords);
    }

    function renderDnsInfo(records) {
        resultsContainer.innerHTML = ''; // Clear loader

        for (const type in records) {
            if (records[type].length > 0) {
                const group = document.createElement('div');
                group.className = 'dns-record-group';
                
                const title = document.createElement('h2');
                title.textContent = `${type} Records`;
                group.appendChild(title);

                records[type].forEach(recordData => {
                    const recordEl = document.createElement('div');
                    recordEl.className = 'dns-record';
                    recordEl.innerHTML = `<span class="type">${type}</span> ${recordData}`;
                    group.appendChild(recordEl);
                });

                resultsContainer.appendChild(group);
            }
        }
    }
});
